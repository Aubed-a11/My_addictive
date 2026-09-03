package bj.myaddictive.live.controller;

import bj.myaddictive.live.dto.MessageChat;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

/** Chat en direct pendant le livestream (section 6.5), via STOMP/WebSocket. */
@Controller
public class ChatLiveController {

    @MessageMapping("/evenement/{id}/chat")
    @SendTo("/topic/evenement/{id}/chat")
    public MessageChat relayerMessage(@DestinationVariable Long id, MessageChat message) {
        return message;
    }
}
