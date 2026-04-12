package com.example.thesis.controller;

import com.example.thesis.models.WorkGroup;
import com.example.thesis.repository.FileMetadataRepository;
import com.example.thesis.security.SecurityUtils;
import com.example.thesis.service.GroupService;
import com.example.thesis.service.FileService;
import com.example.thesis.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*", maxAge = 3600)
public class StatsController {

    private final GroupService groupService;
    private final FileService fileService;
    private final SecurityUtils securityUtils;
    private final NotificationService notificationService;
    private final FileMetadataRepository fileMetadataRepository;

    public StatsController(GroupService groupService, FileService fileService, SecurityUtils securityUtils,
                           NotificationService notificationService, FileMetadataRepository fileMetadataRepository) {
        this.groupService = groupService;
        this.fileService = fileService;
        this.securityUtils = securityUtils;
        this.notificationService = notificationService;
        this.fileMetadataRepository = fileMetadataRepository;
    }

    @GetMapping("/user")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getUserStats() {
        return ResponseEntity.ok(buildUserStats(securityUtils.getCurrentUser().getId()));
    }

    @GetMapping("/user/quick")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getUserQuickStats() {
        return ResponseEntity.ok(buildUserStats(securityUtils.getCurrentUser().getId()));
    }

    private Map<String, Object> buildUserStats(UUID userId) {
        List<WorkGroup> groups = groupService.getUserGroups(userId);

        Long filesRow = fileMetadataRepository.countActiveFilesInUserGroups(userId);
        int totalFiles = filesRow != null ? filesRow.intValue() : 0;

        Long unread = notificationService.getUnreadCount(userId);
        long unreadNotifications = unread != null ? unread : 0L;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalGroups", groups.size());
        stats.put("totalFiles", totalFiles);
        stats.put("totalStorageUsed", fileService.getUserStorageUsed(userId));
        stats.put("unreadNotifications", unreadNotifications);

        return stats;
    }
}