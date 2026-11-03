package bj.myaddictive.votes.service;

import bj.myaddictive.votes.repository.VoteRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Classement en temps reel (section 7.1), diffuse aux clients abonnes via
 * STOMP.
 *
 * Le cache en memoire (ConcurrentHashMap) sert uniquement d'acceleration :
 * a chaque vote, il est incremente directement sans repasser par une
 * requete SQL, pour un affichage instantane. La table Vote reste la seule
 * source de verite persistee (voir VotesService.voter). Si le cache d'une
 * competition est absent (par exemple juste apres un redemarrage du
 * service, qui vide toute la memoire), il est automatiquement reconstruit
 * a la premiere consultation a partir des votes reellement enregistres en
 * base - sans cette reconstruction, un simple redemarrage aurait fait
 * croire, a tort, que tous les scores etaient retombes a zero.
 */
@Service
public class ClassementService {

    private final ConcurrentHashMap<Long, ConcurrentHashMap<Long, AtomicLong>> scores = new ConcurrentHashMap<>();
    private final SimpMessagingTemplate messagingTemplate;
    private final VoteRepository voteRepository;

    public ClassementService(SimpMessagingTemplate messagingTemplate, VoteRepository voteRepository) {
        this.messagingTemplate = messagingTemplate;
        this.voteRepository = voteRepository;
    }

    public void enregistrerVote(Long competitionId, Long candidatId) {
        assurerCacheCharge(competitionId);
        scores.computeIfAbsent(competitionId, id -> new ConcurrentHashMap<>())
                .computeIfAbsent(candidatId, id -> new AtomicLong(0))
                .incrementAndGet();
        messagingTemplate.convertAndSend("/topic/competition/" + competitionId + "/classement", obtenirClassement(competitionId));
    }

    public Map<Long, Double> obtenirClassement(Long competitionId) {
        assurerCacheCharge(competitionId);
        ConcurrentHashMap<Long, AtomicLong> parCandidat = scores.get(competitionId);
        Map<Long, Double> classement = new LinkedHashMap<>();
        if (parCandidat == null) return classement;

        parCandidat.entrySet().stream()
                .sorted(Comparator.<Map.Entry<Long, AtomicLong>>comparingLong(e -> e.getValue().get()).reversed())
                .limit(50)
                .forEach(e -> classement.put(e.getKey(), (double) e.getValue().get()));
        return classement;
    }

    /** Reconstruit le cache d'une competition depuis la base s'il n'existe pas encore en memoire (premier acces apres un redemarrage). */
    private void assurerCacheCharge(Long competitionId) {
        scores.computeIfAbsent(competitionId, id -> {
            ConcurrentHashMap<Long, AtomicLong> reconstruit = new ConcurrentHashMap<>();
            for (Object[] ligne : voteRepository.compterVotesParCandidat(id)) {
                Long candidatId = (Long) ligne[0];
                Long nombre = (Long) ligne[1];
                reconstruit.put(candidatId, new AtomicLong(nombre));
            }
            return reconstruit;
        });
    }
}
