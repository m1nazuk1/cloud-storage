package com.example.thesis.service;

import com.example.thesis.models.Notification;
import com.example.thesis.models.User;
import com.example.thesis.models.enums.NotificationType;
import java.util.List;
import java.util.UUID;

public interface NotificationService {
    Notification createNotification(NotificationType type, String message, User user, UUID groupId);
    void createGroupNotification(NotificationType type, String message, UUID groupId, UUID excludeUserId);
    List<Notification> getUserNotifications(UUID userId);
    List<Notification> getUnreadNotifications(UUID userId);
    void markAsRead(UUID notificationId, UUID userId);
    void markAllAsRead(UUID userId);
    void deleteNotification(UUID notificationId, UUID userId);
    void deleteAllUserNotifications(UUID userId);
    Long getUnreadCount(UUID userId);
}