package com.example.thesis.controller;

import com.example.thesis.models.Notification;
import com.example.thesis.security.SecurityUtils;
import com.example.thesis.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*", maxAge = 3600)
public class NotificationController {

    private final NotificationService notificationService;
    private final SecurityUtils securityUtils;

    public NotificationController(NotificationService notificationService,
                                  SecurityUtils securityUtils) {
        this.notificationService = notificationService;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<Notification>> getUserNotifications() {
        var currentUser = securityUtils.getCurrentUser();
        List<Notification> notifications = notificationService.getUserNotifications(currentUser.getId());
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<Notification>> getUnreadNotifications() {
        var currentUser = securityUtils.getCurrentUser();
        List<Notification> notifications = notificationService.getUnreadNotifications(currentUser.getId());
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/count")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<NotificationCount> getUnreadCount() {
        var currentUser = securityUtils.getCurrentUser();
        Long count = notificationService.getUnreadCount(currentUser.getId());

        NotificationCount notificationCount = new NotificationCount();
        notificationCount.setCount(count);

        return ResponseEntity.ok(notificationCount);
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> markAsRead(@PathVariable UUID id) {
        var currentUser = securityUtils.getCurrentUser();
        notificationService.markAsRead(id, currentUser.getId());
        return ResponseEntity.ok(new AuthController.MessageResponse("Notification marked as read"));
    }

    @PutMapping("/read-all")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> markAllAsRead() {
        var currentUser = securityUtils.getCurrentUser();
        notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.ok(new AuthController.MessageResponse("All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteNotification(@PathVariable UUID id) {
        var currentUser = securityUtils.getCurrentUser();
        notificationService.deleteNotification(id, currentUser.getId());
        return ResponseEntity.ok(new AuthController.MessageResponse("Notification deleted"));
    }

    @DeleteMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteAllNotifications() {
        var currentUser = securityUtils.getCurrentUser();
        notificationService.deleteAllUserNotifications(currentUser.getId());
        return ResponseEntity.ok(new AuthController.MessageResponse("All notifications deleted"));
    }

    static class NotificationCount {
        private Long count;

        public Long getCount() { return count; }
        public void setCount(Long count) { this.count = count; }
    }
}