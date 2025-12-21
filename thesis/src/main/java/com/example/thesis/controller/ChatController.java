package com.example.thesis.controller;

import com.example.thesis.dto.ChatMessageRequest;
import com.example.thesis.models.ChatMessage;
import com.example.thesis.security.SecurityUtils;
import com.example.thesis.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ChatController {

    private final ChatService chatService;
    private final SecurityUtils securityUtils;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(ChatService chatService,
                          SecurityUtils securityUtils,
                          SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.securityUtils = securityUtils;
        this.messagingTemplate = messagingTemplate;
    }

    // REST endpoints
    @GetMapping("/group/{groupId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<ChatMessage>> getGroupMessages(@PathVariable UUID groupId) {
        List<ChatMessage> messages = chatService.getGroupMessages(groupId);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/send")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ChatMessage> sendMessage(@Valid @RequestBody ChatMessageRequest request) {
        var currentUser = securityUtils.getCurrentUser();
        ChatMessage message = chatService.sendMessage(request, currentUser);
        return ResponseEntity.ok(message);
    }

    @PutMapping("/{messageId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> editMessage(@PathVariable UUID messageId,
                                         @RequestParam String newContent) {
        var currentUser = securityUtils.getCurrentUser();
        chatService.editMessage(messageId, newContent, currentUser);
        return ResponseEntity.ok(new AuthController.MessageResponse("Message edited"));
    }

    @DeleteMapping("/{messageId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteMessage(@PathVariable UUID messageId) {
        var currentUser = securityUtils.getCurrentUser();
        chatService.deleteMessage(messageId, currentUser);
        return ResponseEntity.ok(new AuthController.MessageResponse("Message deleted"));
    }

    @GetMapping("/{messageId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ChatMessage> getMessage(@PathVariable UUID messageId) {
        ChatMessage message = chatService.getMessage(messageId);
        return ResponseEntity.ok(message);
    }

    @GetMapping("/group/{groupId}/search")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<ChatMessage>> searchMessages(@PathVariable UUID groupId,
                                                            @RequestParam String query) {
        List<ChatMessage> messages = chatService.searchMessages(groupId, query);
        return ResponseEntity.ok(messages);
    }

    // WebSocket endpoints
    @MessageMapping("/chat.send/{groupId}")
    public void sendMessageWebSocket(@DestinationVariable UUID groupId,
                                     @Payload ChatMessageRequest request) {
        var currentUser = securityUtils.getCurrentUser();
        if (currentUser != null) {
            ChatMessage message = chatService.sendMessage(request, currentUser);
            // Сообщение будет отправлено через @SendTo аннотацию или messagingTemplate
            messagingTemplate.convertAndSend("/topic/group." + groupId + ".chat", message);
        }
    }

    @MessageMapping("/chat.edit/{groupId}")
    public void editMessageWebSocket(@DestinationVariable UUID groupId,
                                     @Payload EditMessageRequest request) {
        var currentUser = securityUtils.getCurrentUser();
        if (currentUser != null) {
            chatService.editMessage(request.getMessageId(), request.getNewContent(), currentUser);
            messagingTemplate.convertAndSend("/topic/group." + groupId + ".chat.update", request);
        }
    }

    @MessageMapping("/chat.delete/{groupId}")
    public void deleteMessageWebSocket(@DestinationVariable UUID groupId,
                                       @Payload DeleteMessageRequest request) {
        var currentUser = securityUtils.getCurrentUser();
        if (currentUser != null) {
            chatService.deleteMessage(request.getMessageId(), currentUser);
            messagingTemplate.convertAndSend("/topic/group." + groupId + ".chat.delete", request);
        }
    }

    // DTO классы для WebSocket
    static class EditMessageRequest {
        private UUID messageId;
        private String newContent;

        public UUID getMessageId() { return messageId; }
        public void setMessageId(UUID messageId) { this.messageId = messageId; }

        public String getNewContent() { return newContent; }
        public void setNewContent(String newContent) { this.newContent = newContent; }
    }

    static class DeleteMessageRequest {
        private UUID messageId;

        public UUID getMessageId() { return messageId; }
        public void setMessageId(UUID messageId) { this.messageId = messageId; }
    }
}