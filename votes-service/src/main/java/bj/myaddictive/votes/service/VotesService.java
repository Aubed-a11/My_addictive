package bj.myaddictive.votes.service;

import bj.myaddictive.votes.domain.*;
import bj.myaddictive.votes.dto.AcheterPiecesRequest;
import bj.myaddictive.votes.dto.VoterRequest;
import bj.myaddictive.votes.exception.ApiException;
import bj.myaddictive.votes.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class VotesService {

    private final CompetitionRepository competitionRepository;
    private final CandidatRepository candidatRepository;
    private final PortefeuilleRepository portefeuilleRepository;
    private final bj.myaddictive.votes.repository.MouvementPortefeuilleRepository mouvementPortefeuilleRepository;
    private final VoteRepository voteRepository;
    private final ClassementService classementService;
    private final WebClient.Builder webClientBuilder;

    public VotesService(CompetitionRepository competitionRepository, CandidatRepository candidatRepository,
                         PortefeuilleRepository portefeuilleRepository,
                         bj.myaddictive.votes.repository.MouvementPortefeuilleRepository mouvementPortefeuilleRepository,
                         VoteRepository voteRepository,
                         ClassementService classementService, WebClient.Builder webClientBuilder) {
        this.competitionRepository = competitionRepository;
        this.candidatRepository = candidatRepository;
        this.portefeuilleRepository = portefeuilleRepository;
        this.mouvementPortefeuilleRepository = mouvementPortefeuilleRepository;
        this.voteRepository = voteRepository;
        this.classementService = classementService;
        this.webClientBuilder = webClientBuilder;
    }

    public Page<Competition> listerCompetitions(Pageable pageable) {
        return competitionRepository.findAll(pageable);
    }

    public Competition obtenirCompetition(Long id) {
        return competitionRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Competition introuvable."));
    }

    public List<Candidat> listerCandidats(Long competitionId) {
        return candidatRepository.findByCompetitionId(competitionId);
    }

    public Candidat obtenirCandidat(Long id) {
        return candidatRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Candidat introuvable."));
    }

    /** Programmation d'une competition (back-office admin). */
    public Competition creerCompetition(Competition competition) {
        return competitionRepository.save(competition);
    }

    public Competition modifierCompetition(Long id, Competition donnees) {
        Competition competition = obtenirCompetition(id);
        competition.setNom(donnees.getNom());
        competition.setCategorie(donnees.getCategorie());
        competition.setSaison(donnees.getSaison());
        competition.setPhase(donnees.getPhase());
        competition.setDateFinPhase(donnees.getDateFinPhase());
        competition.setPonderationPublic(donnees.getPonderationPublic());
        competition.setPonderationJury(donnees.getPonderationJury());
        return competitionRepository.save(competition);
    }

    public void supprimerCompetition(Long id) {
        if (!competitionRepository.existsById(id)) throw new ApiException(HttpStatus.NOT_FOUND, "Competition introuvable.");
        competitionRepository.deleteById(id);
    }

    public Candidat creerCandidat(Candidat candidat) {
        return candidatRepository.save(candidat);
    }

    public Candidat modifierCandidat(Long id, Candidat donnees) {
        Candidat candidat = obtenirCandidat(id);
        candidat.setNom(donnees.getNom());
        candidat.setPhotoUrl(donnees.getPhotoUrl());
        candidat.setVideoUrl(donnees.getVideoUrl());
        candidat.setVille(donnees.getVille());
        candidat.setStatut(donnees.getStatut());
        candidat.setNoteJury(donnees.getNoteJury());
        return candidatRepository.save(candidat);
    }

    public void supprimerCandidat(Long id) {
        if (!candidatRepository.existsById(id)) throw new ApiException(HttpStatus.NOT_FOUND, "Candidat introuvable.");
        candidatRepository.deleteById(id);
    }

    public Map<Long, Double> classement(Long competitionId) {
        return classementService.obtenirClassement(competitionId);
    }

    /**
     * Classement pondere (section 7.1) : "score final pondere entre vote du
     * public et note du jury". Le vote public est normalise par rapport au
     * candidat le plus vote de la competition ; la note du jury est
     * supposee sur 20 (convention francophone). Les deux sont combines
     * selon les coefficients ponderationPublic / ponderationJury definis
     * sur la competition.
     */
    public List<bj.myaddictive.votes.dto.ClassementEntree> classementPondere(Long competitionId) {
        Competition competition = obtenirCompetition(competitionId);
        List<Candidat> candidats = candidatRepository.findByCompetitionId(competitionId);
        Map<Long, Double> votesBruts = classementService.obtenirClassement(competitionId);

        long maxVotes = votesBruts.values().stream().mapToLong(Double::longValue).max().orElse(0L);

        return candidats.stream()
                .map(c -> {
                    long votes = votesBruts.getOrDefault(c.getId(), 0.0).longValue();
                    double voteNormalise = maxVotes > 0 ? (double) votes / maxVotes : 0.0;
                    double noteJury = c.getNoteJury() != null ? c.getNoteJury() : 0.0;
                    double noteJuryNormalisee = Math.min(1.0, Math.max(0.0, noteJury / 20.0));
                    double scoreFinal = (voteNormalise * competition.getPonderationPublic()
                            + noteJuryNormalisee * competition.getPonderationJury()) * 100;
                    return new bj.myaddictive.votes.dto.ClassementEntree(c.getId(), c.getNom(), votes, c.getNoteJury(), scoreFinal);
                })
                .sorted(Comparator.comparingDouble(bj.myaddictive.votes.dto.ClassementEntree::scoreFinal).reversed())
                .collect(Collectors.toList());
    }

    public Long soldePortefeuille(Long utilisateurId) {
        return portefeuilleRepository.findByUtilisateurId(utilisateurId).map(Portefeuille::getSolde).orElse(0L);
    }

    /** Historique des votes de l'utilisateur (section 9.1, "Mon compte"). */
    public List<Vote> mesVotes(Long utilisateurId) {
        return voteRepository.findByUtilisateurIdOrderByDateVoteDesc(utilisateurId);
    }

    /** Achat de pieces (section 7.1) : delegue au paiement-service, credite au consumer RabbitMQ apres confirmation. */
    public Map<String, Object> initierAchatPieces(String userId, AcheterPiecesRequest requete) {
        Map<String, Object> corps = Map.of(
                "moyenPaiement", requete.moyenPaiement(),
                "montantFcfa", requete.montantFcfa(),
                "typeObjet", "PORTEFEUILLE_PIECES",
                "referenceId", String.valueOf(requete.nombrePieces())
        );
        return webClientBuilder.build().post()
                .uri("http://paiement-service/api/paiement/transactions")
                .header("X-User-Id", userId)
                .bodyValue(corps)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    /**
     * Vote instantane (section 7.1) : un vote n'est comptabilise qu'apres
     * depense d'une piece prealablement achetee ; les pieces ne sont pas
     * remboursables (aucun remboursement en cas d'annulation du vote).
     */
    @Transactional
    public void voter(Long utilisateurId, VoterRequest requete) {
        Candidat candidat = obtenirCandidat(requete.candidatId());
        if (candidat.getStatut() == StatutCandidat.ELIMINE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ce candidat a ete elimine, le vote n'est plus possible.");
        }
        Portefeuille portefeuille = portefeuilleRepository.findByUtilisateurId(utilisateurId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Portefeuille vide : achetez des pieces avant de voter."));
        if (portefeuille.getSolde() < 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Solde de pieces insuffisant.");
        }
        portefeuille.setSolde(portefeuille.getSolde() - 1);
        portefeuilleRepository.save(portefeuille);

        bj.myaddictive.votes.domain.MouvementPortefeuille mouvement = new bj.myaddictive.votes.domain.MouvementPortefeuille();
        mouvement.setUtilisateurId(utilisateurId);
        mouvement.setMontant(-1L);
        mouvement.setMotif("Vote : " + candidat.getNom());
        mouvementPortefeuilleRepository.save(mouvement);

        Vote vote = new Vote();
        vote.setUtilisateurId(utilisateurId);
        vote.setCandidatId(candidat.getId());
        vote.setCompetitionId(candidat.getCompetitionId());
        voteRepository.save(vote);

        classementService.enregistrerVote(candidat.getCompetitionId(), candidat.getId());
    }

    /** Historique des mouvements du portefeuille (section 9.1, "Mon Wallet"). */
    public java.util.List<bj.myaddictive.votes.domain.MouvementPortefeuille> historiquePortefeuille(Long utilisateurId) {
        return mouvementPortefeuilleRepository.findByUtilisateurIdOrderByDateMouvementDesc(utilisateurId);
    }
}
