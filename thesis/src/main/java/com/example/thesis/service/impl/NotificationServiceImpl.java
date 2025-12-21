package com.example.thesis.service.impl;

import com.example.thesis.service.NotificationService;
import com.example.thesis.models.Notification;
import com.example.thesis.models.User;
import com.example.thesis.models.WorkGroup;
import com.example.thesis.models.enums.NotificationType;
import com.example.thesis.repository.NotificationRepository;
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
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final WorkGroupRepository workGroupRepository;
    private final MembershipRepository membershipRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationServiceImpl(NotificationRepository notificationRepository,
                                   UserRepository userRepository,
                                   WorkGroupRepository workGroupRepository,
                                   MembershipRepository membershipRepository,
                                   SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.workGroupRepository = workGroupRepository;
        this.membershipRepository = membershipRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    @Transactional
    public Notification createNotification(NotificationType type, String message,
                                           User user, UUID groupId) {
        WorkGroup group = workGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        Notification notification = new Notification();
        notification.setType(type);
        notification.setMessage(message);
        notification.setUser(user);
        notification.setGroup(group);
        notification.setCreatedDate(LocalDateTime.now());
        notification.setRead(false);

        Notification savedNotification = notificationRepository.save(notification);

        // Отправка через WebSocket
        messagingTemplate.convertAndSendToUser(
                user.getId().toString(),
                "/queue/notifications",
                savedNotification
        );

        return savedNotification;
    }

    @Override
    @Transactional
    public void createGroupNotification(NotificationType type, String message,
                                        UUID groupId, UUID excludeUserId) {
        WorkGroup group = workGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        // Получаем всех участников группы, кроме исключенного
        List<UUID> userIds = membershipRepository.findUserIdsByGroupId(groupId);

        for (UUID userId : userIds) {
            if (excludeUserId != null && userId.equals(excludeUserId)) {
                continue;
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Notification notification = new Notification();
            notification.setType(type);
            notification.setMessage(message);
            notification.setUser(user);
            notification.setGroup(group);
            notification.setCreatedDate(LocalDateTime.now());
            notification.setRead(false);

            Notification savedNotification = notificationRepository.save(notification);

            // Отправка через WebSocket
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    savedNotification
            );
        }
    }

    @Override
    public List<Notification> getUserNotifications(UUID userId) {
        return notificationRepository.findByUserId(userId);
    }

    @Override
    public List<Notification> getUnreadNotifications(UUID userId) {
        return notificationRepository.findUnreadByUserId(userId);
    }

    @Override
    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        int updated = notificationRepository.markAsRead(notificationId, userId);
        if (updated == 0) {
            throw new RuntimeException("Notification not found or access denied");
        }
    }

    @Override
    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsRead(userId);
    }

    @Override
    @Transactional
    public void deleteNotification(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        notificationRepository.delete(notification);
    }

    @Override
    @Transactional
    public void deleteAllUserNotifications(UUID userId) {
        List<Notification> notifications = notificationRepository.findByUserId(userId);
        notificationRepository.deleteAll(notifications);
    }

    @Override
    public Long getUnreadCount(UUID userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }
}