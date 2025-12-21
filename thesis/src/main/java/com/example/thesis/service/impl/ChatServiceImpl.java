package com.example.thesis.service.impl;

import com.example.thesis.service.ChatService;
import com.example.thesis.models.ChatMessage;
import com.example.thesis.models.User;
import com.example.thesis.models.WorkGroup;
import com.example.thesis.dto.ChatMessageRequest;
import com.example.thesis.repository.ChatMessageRepository;
import com.example.thesis.repository.UserRepository;
import com.example.thesis.repository.WorkGroupRepository;
import com.example.thesis.repository.MembershipRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final WorkGroupRepository workGroupRepository;
    private final MembershipRepository membershipRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatServiceImpl(ChatMessageRepository chatMessageRepository,
                           UserRepository userRepository,
                           WorkGroupRepository workGroupRepository,
                           MembershipRepository membershipRepository,
                           SimpMessagingTemplate messagingTemplate) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.workGroupRepository = workGroupRepository;
        this.membershipRepository = membershipRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    @Transactional
    public ChatMessage sendMessage(ChatMessageRequest request, User sender) {
        WorkGroup group = workGroupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found"));

        // Проверка прав доступа
        if (!membershipRepository.isUserMemberOfGroup(sender.getId(), request.getGroupId())) {
            throw new RuntimeException("You are not a member of this group");
        }

        ChatMessage message = new ChatMessage();
        message.setContent(request.getContent());
        message.setSender(sender);
        message.setGroup(group);
        message.setTimestamp(LocalDateTime.now());

        // Если есть вложение
        if (request.getAttachmentId() != null) {
            // Здесь нужно получить FileMetadata по ID
            // Для простоты пропустим эту реализацию
        }

        ChatMessage savedMessage = chatMessageRepository.save(message);

        // Отправка через WebSocket
        messagingTemplate.convertAndSend(
                "/topic/group." + group.getId() + ".chat",
                savedMessage
        );

        return savedMessage;
    }

    @Override
    public List<ChatMessage> getGroupMessages(UUID groupId) {
        return chatMessageRepository.findByGroupIdOrderByTimestampAsc(groupId);
    }

    @Override
    public List<ChatMessage> getGroupMessagesSince(UUID groupId, Long timestamp) {
        LocalDateTime since = LocalDateTime.ofEpochSecond(timestamp, 0, java.time.ZoneOffset.UTC);
        return chatMessageRepository.findNewMessages(groupId, since);
    }

    @Override
    @Transactional
    public void editMessage(UUID messageId, String newContent, User requester) {
        int updated = chatMessageRepository.updateMessage(messageId, requester.getId(), newContent);
        if (updated == 0) {
            throw new RuntimeException("Message not found or access denied");
        }

        // Отправка обновленного сообщения через WebSocket
        ChatMessage updatedMessage = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        messagingTemplate.convertAndSend(
                "/topic/group." + updatedMessage.getGroup().getId() + ".chat.update",
                updatedMessage
        );
    }

    @Override
    @Transactional
    public void deleteMessage(UUID messageId, User requester) {
        int deleted = chatMessageRepository.deleteMessage(messageId, requester.getId());
        if (deleted == 0) {
            throw new RuntimeException("Message not found or access denied");
        }

        // Отправка уведомления об удалении через WebSocket
        messagingTemplate.convertAndSend(
                "/topic/chat.delete",
                messageId
        );
    }

    @Override
    public ChatMessage getMessage(UUID messageId) {
        return chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
    }

    @Override
    public List<ChatMessage> searchMessages(UUID groupId, String searchTerm) {
        return chatMessageRepository.searchInGroupChat(groupId, searchTerm);
    }
}