package bj.myaddictive.musique.service;

import bj.myaddictive.musique.domain.Album;
import bj.myaddictive.musique.domain.Ecoute;
import bj.myaddictive.musique.domain.Titre;
import bj.myaddictive.musique.dto.InitierAchatRequest;
import bj.myaddictive.musique.exception.ApiException;
import bj.myaddictive.musique.repository.AchatRepository;
import bj.myaddictive.musique.repository.AlbumRepository;
import bj.myaddictive.musique.repository.EcouteRepository;
import bj.myaddictive.musique.repository.TitreRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class MusiqueService {

    private final TitreRepository titreRepository;
    private final AlbumRepository albumRepository;
    private final AchatRepository achatRepository;
    private final EcouteRepository ecouteRepository;
    private final WebClient.Builder webClientBuilder;

    public MusiqueService(TitreRepository titreRepository, AlbumRepository albumRepository,
                           AchatRepository achatRepository, EcouteRepository ecouteRepository,
                           WebClient.Builder webClientBuilder) {
        this.titreRepository = titreRepository;
        this.albumRepository = albumRepository;
        this.achatRepository = achatRepository;
        this.ecouteRepository = ecouteRepository;
        this.webClientBuilder = webClientBuilder;
    }

    public Page<Titre> listerTitres(String genre, Boolean gratuit, String artiste, Pageable pageable) {
        if (artiste != null) return titreRepository.findByArtiste(artiste, pageable);
        if (gratuit != null && genre != null) return titreRepository.findByGratuitAndGenre(gratuit, genre, pageable);
        if (gratuit != null) return titreRepository.findByGratuit(gratuit, pageable);
        return titreRepository.findAll(pageable);
    }

    public Titre obtenirTitre(Long id) {
        return titreRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Titre introuvable."));
    }

    @Transactional
    public Titre ecouter(Long id) {
        Titre titre = obtenirTitre(id);
        titre.setCompteurEcoutes(titre.getCompteurEcoutes() + 1);
        return titreRepository.save(titre);
    }

    public Page<Album> listerAlbums(Pageable pageable) {
        return albumRepository.findAll(pageable);
    }

    public Album obtenirAlbum(Long id) {
        return albumRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Album introuvable."));
    }

    /** Publication d'un titre/album (back-office admin). */
    public Titre creerTitre(Titre titre) {
        return titreRepository.save(titre);
    }

    public Titre modifierTitre(Long id, Titre donnees) {
        Titre titre = obtenirTitre(id);
        titre.setNom(donnees.getNom());
        titre.setArtiste(donnees.getArtiste());
        titre.setGenre(donnees.getGenre());
        titre.setAlbumId(donnees.getAlbumId());
        titre.setFichierAudioUrl(donnees.getFichierAudioUrl());
        titre.setImageUrl(donnees.getImageUrl());
        titre.setDureeSecondes(donnees.getDureeSecondes());
        titre.setGratuit(donnees.isGratuit());
        titre.setPrixFcfa(donnees.getPrixFcfa());
        return titreRepository.save(titre);
    }

    public void supprimerTitre(Long id) {
        if (!titreRepository.existsById(id)) throw new ApiException(HttpStatus.NOT_FOUND, "Titre introuvable.");
        titreRepository.deleteById(id);
    }

    public Album creerAlbum(Album album) {
        return albumRepository.save(album);
    }

    public Album modifierAlbum(Long id, Album donnees) {
        Album album = obtenirAlbum(id);
        album.setTitre(donnees.getTitre());
        album.setArtiste(donnees.getArtiste());
        album.setImageUrl(donnees.getImageUrl());
        album.setGenre(donnees.getGenre());
        album.setDateSortie(donnees.getDateSortie());
        return albumRepository.save(album);
    }

    public void supprimerAlbum(Long id) {
        if (!albumRepository.existsById(id)) throw new ApiException(HttpStatus.NOT_FOUND, "Album introuvable.");
        albumRepository.deleteById(id);
    }

    public Page<Titre> classement(String type, Pageable pageable) {
        return switch (type) {
            case "telechargements", "ventes" -> titreRepository.findAllByOrderByCompteurTelechargementsDesc(pageable);
            default -> titreRepository.findAllByOrderByCompteurEcoutesDesc(pageable);
        };
    }

    /** Initie l'achat d'un titre payant : delegue au paiement-service, ne debloque rien tant que non confirme. */
    public Map<String, Object> initierAchat(String userId, InitierAchatRequest requete) {
        Titre titre = obtenirTitre(requete.titreId());
        if (titre.isGratuit()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ce titre est deja gratuit, aucun paiement necessaire.");
        }

        Map<String, Object> corps = Map.of(
                "moyenPaiement", requete.moyenPaiement(),
                "montantFcfa", titre.getPrixFcfa(),
                "typeObjet", "TITRE",
                "referenceId", String.valueOf(titre.getId())
        );

        return webClientBuilder.build().post()
                .uri("http://paiement-service/api/paiement/transactions")
                .header("X-User-Id", userId)
                .bodyValue(corps)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    public List<bj.myaddictive.musique.domain.Achat> mesAchats(Long utilisateurId) {
        return achatRepository.findByUtilisateurId(utilisateurId);
    }

    /** Historique d'ecoute personnel (section 9.1) ; distinct du compteur global d'ecoutes du titre. */
    @Transactional
    public void historiserEcoute(Long utilisateurId, Long titreId) {
        obtenirTitre(titreId);
        Ecoute ecoute = new Ecoute();
        ecoute.setUtilisateurId(utilisateurId);
        ecoute.setTitreId(titreId);
        ecouteRepository.save(ecoute);
    }

    public List<Ecoute> mesEcoutes(Long utilisateurId) {
        return ecouteRepository.findByUtilisateurIdOrderByDateEcouteDesc(utilisateurId);
    }

    /**
     * Recommandations construites a partir de l'historique d'ecoute
     * (section 5.2) : determine le genre le plus ecoute par l'utilisateur,
     * puis propose les titres les plus populaires de ce genre qu'il n'a
     * pas deja ecoutes. A defaut d'historique, retombe sur le top
     * streaming general.
     */
    public List<Titre> recommandations(Long utilisateurId) {
        List<Ecoute> historique = mesEcoutes(utilisateurId);
        if (historique.isEmpty()) {
            return titreRepository.findAllByOrderByCompteurEcoutesDesc(
                    org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
        }

        java.util.Set<Long> titresDejaEcoutes = new java.util.HashSet<>();
        java.util.Map<String, Long> compteurParGenre = new java.util.HashMap<>();
        for (Ecoute e : historique) {
            titresDejaEcoutes.add(e.getTitreId());
            titreRepository.findById(e.getTitreId()).ifPresent(t -> {
                if (t.getGenre() != null) {
                    compteurParGenre.merge(t.getGenre(), 1L, Long::sum);
                }
            });
        }

        String genrePrefere = compteurParGenre.entrySet().stream()
                .max(java.util.Map.Entry.comparingByValue())
                .map(java.util.Map.Entry::getKey)
                .orElse(null);

        if (genrePrefere == null) {
            return titreRepository.findAllByOrderByCompteurEcoutesDesc(
                    org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
        }

        return titreRepository.findTop10ByGenreOrderByCompteurEcoutesDesc(genrePrefere).stream()
                .filter(t -> !titresDejaEcoutes.contains(t.getId()))
                .toList();
    }
}
