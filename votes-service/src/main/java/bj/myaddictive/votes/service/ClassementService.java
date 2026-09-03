package bj.myaddictive.votes.service;

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
 * Stocke en memoire (une table de compteurs par competition) plutot que
 * dans un sorted set Redis : suffisant pour une seule instance de
 * votes-service (developpement local sans Docker). En cas de deploiement
 * multi-instance, repasser sur un stockage partage (Redis ZSET, ou une
 * requete SQL groupee) pour un classement coherent entre instances.
 */
@Service
public class ClassementService {

    private final ConcurrentHashMap<Long, ConcurrentHashMap<Long, AtomicLong>> scores = new ConcurrentHashMap<>();
    private final SimpMessagingTemplate messagingTemplate;

    public ClassementService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void enregistrerVote(Long competitionId, Long candidatId) {
        scores.computeIfAbsent(competitionId, id -> new ConcurrentHashMap<>())
                .computeIfAbsent(candidatId, id -> new AtomicLong(0))
                .incrementAndGet();
        messagingTemplate.convertAndSend("/topic/competition/" + competitionId + "/classement", obtenirClassement(competitionId));
    }

    public Map<Long, Double> obtenirClassement(Long competitionId) {
        ConcurrentHashMap<Long, AtomicLong> parCandidat = scores.get(competitionId);
        Map<Long, Double> classement = new LinkedHashMap<>();
        if (parCandidat == null) return classement;

        parCandidat.entrySet().stream()
                .sorted(Comparator.<Map.Entry<Long, AtomicLong>>comparingLong(e -> e.getValue().get()).reversed())
                .limit(50)
                .forEach(e -> classement.put(e.getKey(), (double) e.getValue().get()));
        return classement;
    }
}
