package bj.myaddictive.live.service;

import bj.myaddictive.live.dto.MessageChat;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Chat en direct pendant le livestream (section 6.5). Stocke en memoire les
 * 50 derniers messages par evenement (suffisant pour un chat live ephemere,
 * pas d'historique long terme requis) et les diffuse aussi via STOMP pour
 * les clients qui s'y abonnent directement.
 */
@Service
public class ChatLiveService {

    private static final int LIMITE_MESSAGES = 50;
    private final ConcurrentHashMap<Long, CopyOnWriteArrayList<MessageChat>> messages = new ConcurrentHashMap<>();
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
}
