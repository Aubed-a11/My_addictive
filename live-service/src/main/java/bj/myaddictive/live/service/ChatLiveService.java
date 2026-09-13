package bj.myaddictive.live.service;

import bj.myaddictive.live.dto.MessageChat;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Chat en direct pendant le livestream (section 6.5). Stocke en memoire les
 * 50 derniers messages par evenement (suffisant pour un chat live ephemere,
 * pas d'historique long terme requis) et les diffuse aussi via STOMP pour
 * les clients qui s'y abonnent directement.
 *
 * Gere egalement les "reactions volantes" (coeurs, feu, applaudissements...) :
 * purement ephemeres, jamais persistees en base, juste rediffusees en
 * temps quasi-reel (fenetre glissante de quelques secondes) pour que tous
 * les spectateurs les voient defiler a l'ecran en meme temps, a la maniere
 * d'un livestream Instagram/TikTok.
 */
@Service
public class ChatLiveService {

    private static final int LIMITE_MESSAGES = 50;
    private static final long FENETRE_REACTIONS_MS = 6000; // une reaction n'est visible que 6 secondes, purement transitoire
    private final ConcurrentHashMap<Long, CopyOnWriteArrayList<MessageChat>> messages = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, CopyOnWriteArrayList<long[]>> reactionsBrutes = new ConcurrentHashMap<>(); // [timestampMs, emojiIndex]
    private final ConcurrentHashMap<Long, CopyOnWriteArrayList<String>> reactionsEmojis = new ConcurrentHashMap<>();
    private final SimpMessagingTemplate messagingTemplate;

    public ChatLiveService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public MessageChat envoyer(Long evenementId, String auteur, String contenu) {
        MessageChat message = new MessageChat(auteur, contenu);
        CopyOnWriteArrayList<MessageChat> liste = messages.computeIfAbsent(evenementId, id -> new CopyOnWriteArrayList<>());
        liste.add(message);
        while (liste.size() > LIMITE_MESSAGES) {
            liste.remove(0);
        }
        messagingTemplate.convertAndSend("/topic/evenement/" + evenementId + "/chat", message);
        return message;
    }

    public List<MessageChat> obtenirMessages(Long evenementId) {
        return messages.getOrDefault(evenementId, new CopyOnWriteArrayList<>());
    }

    /** Diffuse une reaction (emoji) a tous les spectateurs de cet evenement. */
    public void envoyerReaction(Long evenementId, String emoji) {
        CopyOnWriteArrayList<long[]> horodatages = reactionsBrutes.computeIfAbsent(evenementId, id -> new CopyOnWriteArrayList<>());
        CopyOnWriteArrayList<String> emojis = reactionsEmojis.computeIfAbsent(evenementId, id -> new CopyOnWriteArrayList<>());
        horodatages.add(new long[]{Instant.now().toEpochMilli()});
        emojis.add(emoji);
        messagingTemplate.convertAndSend("/topic/evenement/" + evenementId + "/reactions", emoji);
        nettoyerReactionsExpirees(evenementId);
    }

    /** Reactions envoyees dans les 6 dernieres secondes (fenetre glissante) : evite de rejouer une reaction deja vue lors d'un precedent appel, cote client, en filtrant par horodatage. */
    public List<String> obtenirReactionsRecentes(Long evenementId, long depuisMs) {
        nettoyerReactionsExpirees(evenementId);
        CopyOnWriteArrayList<long[]> horodatages = reactionsBrutes.getOrDefault(evenementId, new CopyOnWriteArrayList<>());
        CopyOnWriteArrayList<String> emojis = reactionsEmojis.getOrDefault(evenementId, new CopyOnWriteArrayList<>());
        List<String> resultat = new java.util.ArrayList<>();
        for (int i = 0; i < horodatages.size() && i < emojis.size(); i++) {
            if (horodatages.get(i)[0] > depuisMs) resultat.add(emojis.get(i));
        }
        return resultat;
    }

    private void nettoyerReactionsExpirees(Long evenementId) {
        long limite = Instant.now().toEpochMilli() - FENETRE_REACTIONS_MS;
        CopyOnWriteArrayList<long[]> horodatages = reactionsBrutes.get(evenementId);
        CopyOnWriteArrayList<String> emojis = reactionsEmojis.get(evenementId);
        if (horodatages == null || emojis == null) return;
        while (!horodatages.isEmpty() && horodatages.get(0)[0] < limite) {
            horodatages.remove(0);
            if (!emojis.isEmpty()) emojis.remove(0);
        }
    }
}
