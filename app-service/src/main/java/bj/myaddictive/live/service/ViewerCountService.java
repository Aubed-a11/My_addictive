package bj.myaddictive.live.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Compteur de spectateurs en temps reel (section 6.2), diffuse via STOMP.
 *
 * Stocke en memoire (ConcurrentHashMap) plutot que dans Redis : suffisant
 * pour une seule instance de live-service (le cas en developpement local
 * sans Docker). Si le service est deploye en plusieurs instances derriere
 * un load balancer, ce compteur redevient partiel par instance ; repasser
 * alors sur un stockage partage (Redis, ou une base) pour un compte exact.
 */
@Service
public class ViewerCountService {

    private final ConcurrentHashMap<Long, AtomicLong> compteurs = new ConcurrentHashMap<>();
    private final SimpMessagingTemplate messagingTemplate;

    public ViewerCountService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public long entrer(Long evenementId) {
        long compte = compteurs.computeIfAbsent(evenementId, id -> new AtomicLong(0)).incrementAndGet();
        diffuser(evenementId, compte);
        return compte;
    }

    public long sortir(Long evenementId) {
        AtomicLong compteur = compteurs.computeIfAbsent(evenementId, id -> new AtomicLong(0));
        long compte = compteur.updateAndGet(v -> Math.max(0, v - 1));
        diffuser(evenementId, compte);
        return compte;
    }

    public long obtenir(Long evenementId) {
        AtomicLong compteur = compteurs.get(evenementId);
        return compteur == null ? 0 : compteur.get();
    }

    private void diffuser(Long evenementId, long compte) {
        messagingTemplate.convertAndSend("/topic/evenement/" + evenementId + "/spectateurs", compte);
    }
}
