package bj.myaddictive.live.service;

import bj.myaddictive.live.domain.*;
import bj.myaddictive.live.dto.InitierAchatBilletRequest;
import bj.myaddictive.live.exception.ApiException;
import bj.myaddictive.live.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class LiveService {

    private final EvenementRepository evenementRepository;
    private final BilletRepository billetRepository;
    private final ChaineRepository chaineRepository;
    private final AbonnementChaineRepository abonnementChaineRepository;
    private final PodcastRepository podcastRepository;
    private final EpisodeRepository episodeRepository;
    private final AbonnementPodcastRepository abonnementPodcastRepository;
    private final AbonnementFanClubRepository abonnementFanClubRepository;
    private final WebClient.Builder webClientBuilder;

    /** Tarif indicatif du fan club mensuel (section 9.2) ; a ajuster par la direction. */
    public static final long PRIX_FAN_CLUB_MENSUEL_FCFA = 2000L;

    public LiveService(EvenementRepository evenementRepository, BilletRepository billetRepository,
                        ChaineRepository chaineRepository, AbonnementChaineRepository abonnementChaineRepository,
                        PodcastRepository podcastRepository, EpisodeRepository episodeRepository,
                        AbonnementPodcastRepository abonnementPodcastRepository,
                        AbonnementFanClubRepository abonnementFanClubRepository,
                        WebClient.Builder webClientBuilder) {
        this.evenementRepository = evenementRepository;
        this.billetRepository = billetRepository;
        this.chaineRepository = chaineRepository;
        this.abonnementChaineRepository = abonnementChaineRepository;
        this.podcastRepository = podcastRepository;
        this.episodeRepository = episodeRepository;
        this.abonnementPodcastRepository = abonnementPodcastRepository;
        this.abonnementFanClubRepository = abonnementFanClubRepository;
        this.webClientBuilder = webClientBuilder;
    }

    public Page<Evenement> listerEvenements(StatutEvenement statut, Pageable pageable) {
        if (statut != null) return evenementRepository.findByStatut(statut, pageable);
        return evenementRepository.findAll(pageable);
    }

    public Evenement obtenirEvenement(Long id) {
        return evenementRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Evenement introuvable."));
    }

    /** Creation/programmation d'un evenement (back-office). */
    /** Creation/programmation d'un evenement, par le back-office admin ou en auto-service par un organisateur (section 6.1). */
    public Evenement creerEvenement(Long utilisateurCreateurId, Evenement evenement) {
        evenement.setUtilisateurCreateurId(utilisateurCreateurId);
        return evenementRepository.save(evenement);
    }

    /** Un administrateur peut tout modifier ; un organisateur uniquement ses propres evenements. */
    public Evenement modifierEvenement(Long id, Evenement donnees, Long utilisateurId, boolean estAdmin) {
        Evenement evenement = obtenirEvenement(id);
        verifierPropriete(evenement, utilisateurId, estAdmin);
        evenement.setTitre(donnees.getTitre());
        evenement.setLieu(donnees.getLieu());
        evenement.setImageUrl(donnees.getImageUrl());
        evenement.setChaineId(donnees.getChaineId());
        evenement.setDateDebut(donnees.getDateDebut());
        evenement.setStatut(donnees.getStatut());
        evenement.setPayant(donnees.isPayant());
        evenement.setPrixStandardFcfa(donnees.getPrixStandardFcfa());
        evenement.setPrixVipFcfa(donnees.getPrixVipFcfa());
        evenement.setUrlFlux(donnees.getUrlFlux());
        evenement.setUrlReplay(donnees.getUrlReplay());
        evenement.setReplayDisponibleJusqua(donnees.getReplayDisponibleJusqua());
        return evenementRepository.save(evenement);
    }

    public void supprimerEvenement(Long id, Long utilisateurId, boolean estAdmin) {
        Evenement evenement = obtenirEvenement(id);
        verifierPropriete(evenement, utilisateurId, estAdmin);
        evenementRepository.deleteById(id);
    }

    /** Mes evenements crees (auto-service organisateur). */
    public List<Evenement> mesEvenementsCrees(Long utilisateurId) {
        return evenementRepository.findByUtilisateurCreateurId(utilisateurId);
    }

    private void verifierPropriete(Evenement evenement, Long utilisateurId, boolean estAdmin) {
        if (estAdmin) return;
        if (utilisateurId == null || !utilisateurId.equals(evenement.getUtilisateurCreateurId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Vous ne pouvez modifier que les evenements que vous avez crees.");
        }
    }

    /** Achat de billet en deux etapes maximum (section 6.2) : ici, l'etape d'initiation du paiement. */
    public Map<String, Object> initierAchatBillet(String userId, InitierAchatBilletRequest requete) {
        Evenement evenement = obtenirEvenement(requete.evenementId());
        if (evenement.getStatut() == StatutEvenement.TERMINE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cet evenement est termine, la billetterie est fermee.");
        }
        Long prix = requete.categorie() == CategorieBillet.VIP ? evenement.getPrixVipFcfa() : evenement.getPrixStandardFcfa();

        Map<String, Object> corps = new java.util.HashMap<>(Map.of(
                "moyenPaiement", requete.moyenPaiement(),
                "montantFcfa", prix,
                "typeObjet", "BILLET",
                "referenceId", requete.evenementId() + ":" + requete.categorie().name()
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

    public List<bj.myaddictive.live.dto.BilletResponse> mesBillets(Long utilisateurId) {
        return billetRepository.findByUtilisateurId(utilisateurId).stream()
                .map(billet -> {
                    Evenement evenement = evenementRepository.findById(billet.getEvenementId()).orElse(null);
                    return bj.myaddictive.live.dto.BilletResponse.fromEntities(billet, evenement);
                })
                .toList();
    }

    /** Controle a l'entree par scan (section 6.2). */
    public Billet scannerBillet(String codeQr) {
        Billet billet = billetRepository.findByCodeQr(codeQr)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Billet inconnu."));
        if ("UTILISE".equals(billet.getStatut())) {
            throw new ApiException(HttpStatus.CONFLICT, "Ce billet a deja ete scanne.");
        }
        if ("ANNULE".equals(billet.getStatut())) {
            throw new ApiException(HttpStatus.CONFLICT, "Ce billet a ete annule.");
        }
        billet.setStatut("UTILISE");
        billet.setDateScan(java.time.Instant.now());
        return billetRepository.save(billet);
    }

    public Page<Chaine> listerChaines(Pageable pageable) {
        return chaineRepository.findAll(pageable);
    }

    public Chaine obtenirChaine(Long id) {
        return chaineRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Chaine introuvable."));
    }

    /** Creation d'une chaine (back-office admin, ou auto-service organisateur/artiste). */
    public Chaine creerChaine(Long utilisateurId, Chaine chaine) {
        chaine.setProprietaireUtilisateurId(utilisateurId);
        chaine.setNombreAbonnes(0L);
        return chaineRepository.save(chaine);
    }

    public Chaine modifierChaine(Long id, Chaine donnees) {
        Chaine chaine = obtenirChaine(id);
        chaine.setNom(donnees.getNom());
        chaine.setImageUrl(donnees.getImageUrl());
        chaine.setDescription(donnees.getDescription());
        return chaineRepository.save(chaine);
    }

    public void supprimerChaine(Long id) {
        if (!chaineRepository.existsById(id)) throw new ApiException(HttpStatus.NOT_FOUND, "Chaine introuvable.");
        chaineRepository.deleteById(id);
    }

    public Podcast creerPodcast(Podcast podcast) {
        return podcastRepository.save(podcast);
    }

    public Podcast modifierPodcast(Long id, Podcast donnees) {
        Podcast podcast = podcastRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Podcast introuvable."));
        podcast.setTitre(donnees.getTitre());
        podcast.setDescription(donnees.getDescription());
        podcast.setImageUrl(donnees.getImageUrl());
        podcast.setChaineId(donnees.getChaineId());
        return podcastRepository.save(podcast);
    }

    public void supprimerPodcast(Long id) {
        if (!podcastRepository.existsById(id)) throw new ApiException(HttpStatus.NOT_FOUND, "Podcast introuvable.");
        podcastRepository.deleteById(id);
    }

    public Episode creerEpisode(Episode episode) {
        podcastRepository.findById(episode.getPodcastId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Podcast introuvable."));
        return episodeRepository.save(episode);
    }

    public void supprimerEpisode(Long id) {
        if (!episodeRepository.existsById(id)) throw new ApiException(HttpStatus.NOT_FOUND, "Episode introuvable.");
        episodeRepository.deleteById(id);
    }

    public void abonner(Long utilisateurId, Long chaineId) {
        if (abonnementChaineRepository.findByUtilisateurIdAndChaineId(utilisateurId, chaineId).isPresent()) return;
        Chaine chaine = obtenirChaine(chaineId);
        AbonnementChaine abonnement = new AbonnementChaine();
        abonnement.setUtilisateurId(utilisateurId);
        abonnement.setChaineId(chaineId);
        abonnementChaineRepository.save(abonnement);
        chaine.setNombreAbonnes(chaine.getNombreAbonnes() + 1);
        chaineRepository.save(chaine);
    }

    /** Chaines suivies par l'utilisateur (recommandations, section 4.2). */
    public List<Chaine> mesChainesSuivies(Long utilisateurId) {
        return abonnementChaineRepository.findByUtilisateurId(utilisateurId).stream()
                .map(a -> chaineRepository.findById(a.getChaineId()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    /**
     * Fan club ou abonnement mensuel a un artiste (section 9.2) : acces
     * anticipe, contenu exclusif. Initie le paiement ; l'abonnement n'est
     * cree/prolonge qu'a la confirmation (voir confirmerAbonnementFanClub).
     */
    public Map<String, Object> initierAbonnementFanClub(String userId, Long chaineId) {
        obtenirChaine(chaineId);
        Map<String, Object> corps = Map.of(
                "moyenPaiement", "MTN_MOMO",
                "montantFcfa", PRIX_FAN_CLUB_MENSUEL_FCFA,
                "typeObjet", "FAN_CLUB",
                "referenceId", String.valueOf(chaineId)
        );
        return webClientBuilder.build().post()
                .uri("http://paiement-service/api/paiement/transactions")
                .header("X-User-Id", userId)
                .bodyValue(corps)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    /** Cree l'abonnement ou le prolonge de 30 jours (appele apres confirmation du paiement). */
    public void confirmerAbonnementFanClub(Long utilisateurId, Long chaineId) {
        java.time.Instant maintenant = java.time.Instant.now();
        AbonnementFanClub abonnement = abonnementFanClubRepository.findByUtilisateurIdAndChaineId(utilisateurId, chaineId)
                .orElseGet(() -> {
                    AbonnementFanClub a = new AbonnementFanClub();
                    a.setUtilisateurId(utilisateurId);
                    a.setChaineId(chaineId);
                    a.setDateExpiration(maintenant);
                    return a;
                });
        java.time.Instant base = abonnement.getDateExpiration().isAfter(maintenant) ? abonnement.getDateExpiration() : maintenant;
        abonnement.setDateExpiration(base.plus(30, java.time.temporal.ChronoUnit.DAYS));
        abonnementFanClubRepository.save(abonnement);
    }

    /** Statut du fan club pour l'utilisateur courant (acces anticipe/contenu exclusif). */
    public Map<String, Object> statutFanClub(Long utilisateurId, Long chaineId) {
        return abonnementFanClubRepository.findByUtilisateurIdAndChaineId(utilisateurId, chaineId)
                .map(a -> Map.<String, Object>of("actif", a.getDateExpiration().isAfter(java.time.Instant.now()), "dateExpiration", a.getDateExpiration()))
                .orElse(Map.of("actif", false));
    }

    public Page<Podcast> listerPodcasts(Pageable pageable) {
        return podcastRepository.findAll(pageable);
    }

    public List<Episode> listerEpisodes(Long podcastId) {
        return episodeRepository.findByPodcastIdOrderByNumeroSaisonDescNumeroEpisodeDesc(podcastId);
    }

    /** Abonnement a une emission (section 6.4) : notification a la sortie d'un nouvel episode. */
    public void abonnerPodcast(Long utilisateurId, Long podcastId) {
        if (abonnementPodcastRepository.findByUtilisateurIdAndPodcastId(utilisateurId, podcastId).isPresent()) return;
        podcastRepository.findById(podcastId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Podcast introuvable."));
        AbonnementPodcast abonnement = new AbonnementPodcast();
        abonnement.setUtilisateurId(utilisateurId);
        abonnement.setPodcastId(podcastId);
        abonnementPodcastRepository.save(abonnement);
    }
}
