package bj.myaddictive.live.service;

import bj.myaddictive.live.domain.OptionSondage;
import bj.myaddictive.live.domain.Sondage;
import bj.myaddictive.live.domain.SondageVote;
import bj.myaddictive.live.dto.CreerSondageRequest;
import bj.myaddictive.live.dto.OptionResultat;
import bj.myaddictive.live.dto.SondageResultat;
import bj.myaddictive.live.exception.ApiException;
import bj.myaddictive.live.repository.OptionSondageRepository;
import bj.myaddictive.live.repository.SondageRepository;
import bj.myaddictive.live.repository.SondageVoteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Sondages et questions-reponses lances par l'organisateur pendant le
 * direct (section 6.5). Un utilisateur ne peut voter qu'une seule fois par
 * sondage ; les resultats sont recalcules et diffuses en temps reel via
 * STOMP a chaque nouveau vote.
 */
@Service
public class SondageService {

    private final SondageRepository sondageRepository;
    private final OptionSondageRepository optionSondageRepository;
    private final SondageVoteRepository sondageVoteRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public SondageService(SondageRepository sondageRepository, OptionSondageRepository optionSondageRepository,
                           SondageVoteRepository sondageVoteRepository, SimpMessagingTemplate messagingTemplate) {
        this.sondageRepository = sondageRepository;
        this.optionSondageRepository = optionSondageRepository;
        this.sondageVoteRepository = sondageVoteRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public SondageResultat creerSondage(Long evenementId, CreerSondageRequest requete) {
        Sondage sondage = new Sondage();
        sondage.setEvenementId(evenementId);
        sondage.setQuestion(requete.question());
        sondage = sondageRepository.save(sondage);

        for (String texte : requete.options()) {
            OptionSondage option = new OptionSondage();
            option.setSondageId(sondage.getId());
            option.setTexte(texte);
            optionSondageRepository.save(option);
        }

        SondageResultat resultat = calculerResultat(sondage, null);
        diffuser(evenementId);
        return resultat;
    }

    public List<SondageResultat> listerSondagesActifs(Long evenementId, Long utilisateurId) {
        return sondageRepository.findByEvenementIdAndActifTrue(evenementId).stream()
                .map(s -> calculerResultat(s, utilisateurId))
                .toList();
    }

    /**
     * Enregistre le vote (regle : un seul vote par utilisateur et par
     * sondage) puis diffuse les nouveaux resultats a tous les spectateurs
     * abonnes au canal de l'evenement.
     */
    @Transactional
    public SondageResultat voter(Long sondageId, Long optionId, Long utilisateurId) {
        Sondage sondage = sondageRepository.findById(sondageId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sondage introuvable."));
        if (!sondage.isActif()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ce sondage est cloture.");
        }
        OptionSondage option = optionSondageRepository.findById(optionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Option introuvable."));
        if (!option.getSondageId().equals(sondageId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cette option n'appartient pas a ce sondage.");
        }
        if (sondageVoteRepository.findBySondageIdAndUtilisateurId(sondageId, utilisateurId).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Vous avez deja vote a ce sondage.");
        }

        SondageVote vote = new SondageVote();
        vote.setSondageId(sondageId);
        vote.setOptionId(optionId);
        vote.setUtilisateurId(utilisateurId);
        sondageVoteRepository.save(vote);

        SondageResultat resultat = calculerResultat(sondage, utilisateurId);
        diffuser(sondage.getEvenementId());
        return resultat;
    }

    @Transactional
    public SondageResultat cloturer(Long sondageId) {
        Sondage sondage = sondageRepository.findById(sondageId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sondage introuvable."));
        sondage.setActif(false);
        sondage = sondageRepository.save(sondage);
        SondageResultat resultat = calculerResultat(sondage, null);
        diffuser(sondage.getEvenementId());
        return resultat;
    }

    private SondageResultat calculerResultat(Sondage sondage, Long utilisateurId) {
        List<OptionSondage> options = optionSondageRepository.findBySondageId(sondage.getId());
        List<SondageVote> votes = sondageVoteRepository.findBySondageId(sondage.getId());
        long total = votes.size();

        Long optionVoteeParMoi = utilisateurId == null ? null : votes.stream()
                .filter(v -> v.getUtilisateurId().equals(utilisateurId))
                .map(SondageVote::getOptionId)
                .findFirst().orElse(null);

        List<OptionResultat> resultatsOptions = options.stream()
                .map(o -> {
                    long nb = votes.stream().filter(v -> v.getOptionId().equals(o.getId())).count();
                    double pourcentage = total > 0 ? (nb * 100.0 / total) : 0.0;
                    return new OptionResultat(o.getId(), o.getTexte(), nb, pourcentage);
                })
                .toList();

        return new SondageResultat(sondage.getId(), sondage.getEvenementId(), sondage.getQuestion(),
                sondage.isActif(), total, resultatsOptions, optionVoteeParMoi);
    }

    private void diffuser(Long evenementId) {
        List<SondageResultat> resultats = listerSondagesActifs(evenementId, null);
        messagingTemplate.convertAndSend("/topic/evenement/" + evenementId + "/sondages", resultats);
    }
}
