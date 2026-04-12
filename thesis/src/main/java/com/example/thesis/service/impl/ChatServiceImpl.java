package com.example.thesis.service.impl;

import com.example.thesis.service.ChatService;
import com.example.thesis.service.NotificationService;
import com.example.thesis.models.ChatMessage;
import com.example.thesis.models.FileMetadata;
import com.example.thesis.models.Membership;
import com.example.thesis.models.User;
import com.example.thesis.models.WorkGroup;
import com.example.thesis.models.enums.NotificationType;
import com.example.thesis.dto.ChatMessageRequest;
import com.example.thesis.repository.ChatMessageRepository;
import com.example.thesis.repository.FileMetadataRepository;
import com.example.thesis.repository.MembershipRepository;
import com.example.thesis.repository.UserRepository;
import com.example.thesis.repository.WorkGroupRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ChatServiceImpl implements ChatService {

    private static final Pattern MENTION_PATTERN = Pattern.compile("@([a-zA-Z0-9_.]{2,64})");

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final WorkGroupRepository workGroupRepository;
    private final MembershipRepository membershipRepository;
    private final FileMetadataRepository fileMetadataRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatServiceImpl(ChatMessageRepository chatMessageRepository,
                           UserRepository userRepository,
                           WorkGroupRepository workGroupRepository,
                           MembershipRepository membershipRepository,
                           FileMetadataRepository fileMetadataRepository,
                           NotificationService notificationService,
                           SimpMessagingTemplate messagingTemplate) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.workGroupRepository = workGroupRepository;
        this.membershipRepository = membershipRepository;
        this.fileMetadataRepository = fileMetadataRepository;
        this.notificationService = notificationService;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    @Transactional
    public ChatMessage sendMessage(ChatMessageRequest request, User sender) {
        WorkGroup group = workGroupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found"));

        if (!membershipRepository.isUserMemberOfGroup(sender.getId(), request.getGroupId())) {
            throw new RuntimeException("You are not a member of this group");
        }

        String sticker = request.getStickerCode() != null ? request.getStickerCode().trim() : "";
        String text = request.getContent() != null ? request.getContent().trim() : "";
        UUID attId = request.getAttachmentId();

        ChatMessage message = new ChatMessage();
        message.setSender(sender);
        message.setGroup(group);
        message.setTimestamp(LocalDateTime.now());
        message.setEdited(false);

        if (!sticker.isEmpty()) {
            if (sticker.length() > 64) {
                throw new RuntimeException("Слишком длинный стикер");
            }
            message.setMessageKind("STICKER");
            message.setContent(sticker);
        } else if (attId != null) {
            FileMetadata fm = fileMetadataRepository.findById(attId)
                    .orElseThrow(() -> new RuntimeException("Вложение не найдено"));
            if (!fm.getParentGroup().getId().equals(group.getId())) {
                throw new RuntimeException("Файл не из этой группы");
            }
            if (!fm.getUploader().getId().equals(sender.getId())) {
                throw new RuntimeException("Можно прикреплять только свои загрузки");
            }
            message.setAttachment(fm);
            String mime = fm.getMimeType() != null ? fm.getMimeType() : "";
            if (mime.startsWith("audio/")) {
                message.setMessageKind("AUDIO");
            } else if (mime.startsWith("image/")) {
                message.setMessageKind("IMAGE");
            } else {
                message.setMessageKind("FILE");
            }
            message.setContent(text);
        } else {
            if (text.isEmpty()) {
                throw new RuntimeException("Пустое сообщение");
            }
            message.setContent(text);
            message.setMessageKind("TEXT");
        }

        ChatMessage savedMessage = chatMessageRepository.save(message);

        if ("TEXT".equals(savedMessage.getMessageKind())) {
            notifyMentions(text, sender, group);
        }

        messagingTemplate.convertAndSend(
                "/topic/group." + group.getId() + ".chat",
                savedMessage
        );

        return savedMessage;
    }

    private void notifyMentions(String text, User sender, WorkGroup group) {
        Matcher m = MENTION_PATTERN.matcher(text);
        Set<String> seen = new HashSet<>();
        List<Membership> members = membershipRepository.findByGroupIdWithUsers(group.getId());
        Map<String, User> userByLowerName = new HashMap<>();
        for (Membership mem : members) {
            User u = mem.getUser();
            userByLowerName.put(u.getUsername().toLowerCase(), u);
        }
        while (m.find()) {
            String raw = m.group(1);
            String key = raw.toLowerCase();
            if (seen.contains(key)) {
                continue;
            }
            seen.add(key);
            User target = userByLowerName.get(key);
            if (target == null || target.getId().equals(sender.getId())) {
                continue;
            }
            String msg = sender.getUsername() + " упомянул вас в чате группы «" + group.getName() + "»";
            notificationService.createNotification(NotificationType.CHAT_MENTION, msg, target, group.getId());
        }
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
        ChatMessage existing = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Сообщение не найдено"));
        java.util.UUID groupId = existing.getGroup().getId();

        int deleted = chatMessageRepository.deleteMessage(messageId, requester.getId());
        if (deleted == 0) {
            throw new RuntimeException("Сообщение не найдено или нет прав");
        }

        Map<String, String> deletePayload = new HashMap<>();
        deletePayload.put("messageId", messageId.toString());
        messagingTemplate.convertAndSend(
                "/topic/group." + groupId + ".chat.delete",
                deletePayload
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
