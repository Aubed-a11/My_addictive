package bj.myaddictive.musique.config;

import bj.myaddictive.musique.domain.Album;
import bj.myaddictive.musique.domain.Titre;
import bj.myaddictive.musique.repository.AlbumRepository;
import bj.myaddictive.musique.repository.TitreRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * Import ponctuel du catalogue musical de l'ancien site My Addictive
 * (tables mya_album + mya_albumtrack), a partir de
 * resources/legacy/albums_legacy.json et titres_legacy.json.
 *
 * Note : mob_streaming (387k lignes d'historique brut de lecture/telechargement)
 * n'est PAS reimporte ligne a ligne ici. Ses effets sont deja agreges dans les
 * compteurs ecoute/telecharge de mya_albumtrack, repris directement sur
 * compteurEcoutes/compteurTelechargements.
 */
@Component
@Order(1)
public class ImporteurLegacyMusique implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ImporteurLegacyMusique.class);

    private final AlbumRepository albumRepository;
    private final TitreRepository titreRepository;

    public ImporteurLegacyMusique(AlbumRepository albumRepository, TitreRepository titreRepository) {
        this.albumRepository = albumRepository;
        this.titreRepository = titreRepository;
    }

    private record LigneAlbum(String titre, String artiste, String genre, String imageUrl, String dateSortie, String sourceLegacyId) {}

    private record LigneTitre(
            String nom, String artiste, String genre, String fichierAudioUrl, String imageUrl, boolean gratuit,
            Long prixFcfa, Long compteurEcoutes, Long compteurTelechargements,
            String sourceLegacyId, Integer indexAlbumLegacy) {}

    @Override
    public void run(String... args) throws Exception {
        if (titreRepository.count() > 5) {
            log.info("Import legacy de la musique deja effectue ({} titres en base), etape ignoree.", titreRepository.count());
            return;
        }

        ObjectMapper mapper = new ObjectMapper();

        ClassPathResource ressourceAlbums = new ClassPathResource("legacy/albums_legacy.json");
        ClassPathResource ressourceTitres = new ClassPathResource("legacy/titres_legacy.json");
        if (!ressourceAlbums.exists() || !ressourceTitres.exists()) {
            log.info("Fichiers legacy introuvables, import ignore.");
            return;
        }

        List<LigneAlbum> lignesAlbums;
        try (InputStream in = ressourceAlbums.getInputStream()) {
            lignesAlbums = mapper.readValue(in, mapper.getTypeFactory().constructCollectionType(List.class, LigneAlbum.class));
        }
        List<LigneTitre> lignesTitres;
        try (InputStream in = ressourceTitres.getInputStream()) {
            lignesTitres = mapper.readValue(in, mapper.getTypeFactory().constructCollectionType(List.class, LigneTitre.class));
        }

        // Pas de @Transactional global : une ligne de donnees problematique ne
        // doit jamais faire echouer tout l'import ni empecher le demarrage.
        // Cree les albums d'abord, en conservant (via un placeholder null en cas
        // d'echec) l'alignement d'index avec le fichier source, pour pouvoir
        // rattacher les titres au bon album ensuite malgre d'eventuelles erreurs.
        List<Long> idsAlbumsCrees = new ArrayList<>();
        int albumsErreurs = 0;
        for (LigneAlbum ligne : lignesAlbums) {
            try {
                Album a = new Album();
                a.setTitre(ligne.titre());
                a.setArtiste(ligne.artiste());
                a.setGenre(ligne.genre());
                a.setImageUrl(ligne.imageUrl());
                a.setDateSortie(ligne.dateSortie());
                a = albumRepository.save(a);
                idsAlbumsCrees.add(a.getId());
            } catch (Exception e) {
                albumsErreurs++;
                idsAlbumsCrees.add(null);
                log.warn("Album ignore lors de l'import legacy (source id={}) : {}", ligne.sourceLegacyId(), e.getMessage());
            }
        }

        int titresImportes = 0;
        int titresErreurs = 0;
        for (LigneTitre ligne : lignesTitres) {
            try {
                if (ligne.nom() == null || ligne.nom().isBlank()) continue;
                Titre t = new Titre();
                t.setNom(ligne.nom());
                t.setArtiste(ligne.artiste());
                t.setGenre(ligne.genre());
                t.setFichierAudioUrl(ligne.fichierAudioUrl());
                t.setImageUrl(ligne.imageUrl());
                t.setGratuit(ligne.gratuit());
                t.setPrixFcfa(ligne.gratuit() ? 0L : (ligne.prixFcfa() != null ? ligne.prixFcfa() : 0L));
                t.setCompteurEcoutes(ligne.compteurEcoutes() != null ? ligne.compteurEcoutes() : 0L);
                t.setCompteurTelechargements(ligne.compteurTelechargements() != null ? ligne.compteurTelechargements() : 0L);
                if (ligne.indexAlbumLegacy() != null && ligne.indexAlbumLegacy() >= 0 && ligne.indexAlbumLegacy() < idsAlbumsCrees.size()) {
                    t.setAlbumId(idsAlbumsCrees.get(ligne.indexAlbumLegacy()));
                }
                titreRepository.save(t);
                titresImportes++;
            } catch (Exception e) {
                titresErreurs++;
                log.warn("Titre ignore lors de l'import legacy (source id={}) : {}", ligne.sourceLegacyId(), e.getMessage());
            }
        }

        log.info("Import legacy de la musique termine : {} albums crees ({} en erreur), {} titres crees ({} en erreur).",
                idsAlbumsCrees.size() - albumsErreurs, albumsErreurs, titresImportes, titresErreurs);
    }
}
