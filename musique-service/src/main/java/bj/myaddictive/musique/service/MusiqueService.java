package bj.myaddictive.musique.service;

import bj.myaddictive.musique.domain.Album;
import bj.myaddictive.musique.domain.Achat;
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
        return listerTitres(genre, gratuit, artiste, null, pageable, null);
    }

    /**
     * Meme filtre que obtenirTitre(id, utilisateurId) applique a une page
     * entiere : sans ca, parcourir simplement le catalogue (l'onglet
     * Musique, un classement, une recherche...) suffisait a recuperer
     * fichierAudioUrl pour tous les titres payants d'un coup, une faille
     * bien plus grave que sur la fiche individuelle puisqu'elle s'active
     * des l'ouverture normale de l'app, sans action particuliere.
     */
    public Page<Titre> listerTitres(String genre, Boolean gratuit, String artiste, Long albumId, Pageable pageable, Long utilisateurId) {
        Page<Titre> page;
        if (albumId != null) page = titreRepository.findByAlbumId(albumId, pageable);
        else if (artiste != null) page = titreRepository.findByArtiste(artiste, pageable);
        else if (gratuit != null && genre != null) page = titreRepository.findByGratuitAndGenreContaining(gratuit, genre, pageable);
        else if (genre != null) page = titreRepository.findByGenreContaining(genre, pageable);
        else if (gratuit != null) page = titreRepository.findByGratuit(gratuit, pageable);
        else page = titreRepository.findAll(pageable);

        java.util.Set<Long> titresAchetes = utilisateurId == null ? java.util.Set.of()
                : achatRepository.findByUtilisateurId(utilisateurId).stream().map(Achat::getTitreId).collect(java.util.stream.Collectors.toSet());
        return page.map(titre -> masquerSiNonAchete(titre, titresAchetes.contains(titre.getId())));
    }

    private Titre masquerSiNonAchete(Titre titre, boolean possede) {
        if (titre.isGratuit() || possede) return titre;
        Titre copie = new Titre();
        copie.setId(titre.getId());
        copie.setNom(titre.getNom());
        copie.setArtiste(titre.getArtiste());
        copie.setGenre(titre.getGenre());
        copie.setImageUrl(titre.getImageUrl());
        copie.setDureeSecondes(titre.getDureeSecondes());
        copie.setPrixFcfa(titre.getPrixFcfa());
        copie.setGratuit(titre.isGratuit());
        copie.setAlbumId(titre.getAlbumId());
        copie.setCompteurEcoutes(titre.getCompteurEcoutes());
        copie.setCompteurTelechargements(titre.getCompteurTelechargements());
        copie.setYoutubeUrl(titre.getYoutubeUrl());
        copie.setDateAjout(titre.getDateAjout());
        copie.setFichierAudioUrl(null);
        return copie;
    }

    public Titre obtenirTitre(Long id) {
        return titreRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Titre introuvable."));
    }

    /**
     * Version destinee a l'API publique (fiche titre, lecteur) : masque
     * fichierAudioUrl si le titre est payant et que l'utilisateur ne l'a
     * pas achete (ou n'est pas connecte). Sans ce filtre, n'importe qui
     * pouvait recuperer directement l'URL du fichier audio complet via cet
     * endpoint, contournant entierement le systeme d'achat - le lecteur
     * cote app ne faisait que suivre l'URL fournie, sans lui-meme verifier
     * quoi que ce soit. Renvoie une copie non persistee : ne jamais
     * sauvegarder l'objet retourne par cette methode.
     */
    public Titre obtenirTitre(Long id, Long utilisateurId) {
        Titre titre = obtenirTitre(id);
        boolean possede = utilisateurId != null && achatRepository.findByUtilisateurIdAndTitreId(utilisateurId, id).isPresent();
        return masquerSiNonAchete(titre, possede);
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

    /** Section "Brand New" (accueil Musique) : derniers titres ayant un clip officiel renseigne, du plus recent au plus ancien. */
    public Page<Titre> nouveautes(Pageable pageable) {
        return titreRepository.findByYoutubeUrlIsNotNullOrderByDateAjoutDesc(pageable);
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
        titre.setYoutubeUrl(donnees.getYoutubeUrl());
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
        return classement(type, pageable, null);
    }

    /**
     * Trois "Tops" bien distincts (section "Tous nos Tops") :
     * - streaming : nombre d'ecoutes, tous titres confondus
     * - telechargement_gratuit : uniquement les titres gratuits, tries par
     *   telechargements (n'a de sens que pour du contenu gratuit)
     * - ventes : construit a partir des vrais achats enregistres (table
     *   Achat), et non plus du meme compteur que les telechargements
     *   gratuits comme c'etait le cas avant - un "Top Vente" et un "Top
     *   Telechargement gratuit" identiques n'avait pas de sens.
     */
    public Page<Titre> classement(String type, Pageable pageable, Long utilisateurId) {
        Page<Titre> page = switch (type) {
            case "telechargement_gratuit" -> titreRepository.findByGratuitOrderByCompteurTelechargementsDesc(true, pageable);
            case "ventes" -> classementVentes(pageable);
            default -> titreRepository.findAllByOrderByCompteurEcoutesDesc(pageable);
        };
        java.util.Set<Long> titresAchetes = utilisateurId == null ? java.util.Set.of()
                : achatRepository.findByUtilisateurId(utilisateurId).stream().map(Achat::getTitreId).collect(java.util.stream.Collectors.toSet());
        return page.map(titre -> masquerSiNonAchete(titre, titresAchetes.contains(titre.getId())));
    }

    /** Construit une Page a partir du resultat groupe (titreId, nombre de ventes), en conservant l'ordre du plus vendu au moins vendu. */
    private Page<Titre> classementVentes(Pageable pageable) {
        List<Object[]> lignes = achatRepository.topVentes(pageable);
        List<Titre> titres = new java.util.ArrayList<>();
        for (Object[] ligne : lignes) {
            titreRepository.findById((Long) ligne[0]).ifPresent(titres::add);
        }
        return new org.springframework.data.domain.PageImpl<>(titres, pageable, titres.size());
    }

    /** Initie l'achat d'un titre payant : delegue au paiement-service, ne debloque rien tant que non confirme. */
    public Map<String, Object> initierAchat(String userId, InitierAchatRequest requete) {
        Titre titre = obtenirTitre(requete.titreId());
        if (titre.isGratuit()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ce titre est deja gratuit, aucun paiement necessaire.");
        }

        Map<String, Object> corps = new java.util.HashMap<>(Map.of(
                "moyenPaiement", requete.moyenPaiement(),
                "montantFcfa", titre.getPrixFcfa(),
                "typeObjet", "TITRE",
                "referenceId", String.valueOf(titre.getId())
        ));
        if (requete.telephonePayeur() != null) corps.put("telephonePayeur", requete.telephonePayeur());

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
        java.util.Set<Long> titresAchetes = achatRepository.findByUtilisateurId(utilisateurId).stream()
                .map(Achat::getTitreId).collect(java.util.stream.Collectors.toSet());

        List<Ecoute> historique = mesEcoutes(utilisateurId);
        if (historique.isEmpty()) {
            return titreRepository.findAllByOrderByCompteurEcoutesDesc(
                    org.springframework.data.domain.PageRequest.of(0, 10)).getContent().stream()
                    .map(t -> masquerSiNonAchete(t, titresAchetes.contains(t.getId()))).toList();
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
                    org.springframework.data.domain.PageRequest.of(0, 10)).getContent().stream()
                    .map(t -> masquerSiNonAchete(t, titresAchetes.contains(t.getId()))).toList();
        }

        return titreRepository.findTop10ByGenreContainingOrderByCompteurEcoutesDesc(genrePrefere).stream()
                .filter(t -> !titresDejaEcoutes.contains(t.getId()))
                .map(t -> masquerSiNonAchete(t, titresAchetes.contains(t.getId())))
                .toList();
    }
}
