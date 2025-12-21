package com.example.thesis.service;

import com.example.thesis.models.ChatMessage;
import com.example.thesis.models.User;
import com.example.thesis.dto.ChatMessageRequest;
import java.util.List;
import java.util.UUID;

public interface ChatService {
    ChatMessage sendMessage(ChatMessageRequest request, User sender);
    List<ChatMessage> getGroupMessages(UUID groupId);
    List<ChatMessage> getGroupMessagesSince(UUID groupId, Long timestamp);
    void editMessage(UUID messageId, String newContent, User requester);
    void deleteMessage(UUID messageId, User requester);
    ChatMessage getMessage(UUID messageId);
    List<ChatMessage> searchMessages(UUID groupId, String searchTerm);
}