package com.example.thesis.controller;

import com.example.thesis.security.SecurityUtils;
import com.example.thesis.service.GroupService;
import com.example.thesis.service.FileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*", maxAge = 3600)
public class StatsController {

    private final GroupService groupService;
    private final FileService fileService;
    private final SecurityUtils securityUtils;

    public StatsController(GroupService groupService, FileService fileService, SecurityUtils securityUtils) {
        this.groupService = groupService;
        this.fileService = fileService;
        this.securityUtils = securityUtils;
    }

    @GetMapping("/user")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getUserStats() {
        var currentUser = securityUtils.getCurrentUser();
        UUID userId = currentUser.getId();

        // Получаем группы пользователя
        var groups = groupService.getUserGroups(userId);

        // Рассчитываем общее количество участников во всех группах
        int totalMembers = 0;
        int totalFiles = 0;

        for (var group : groups) {
            // Получаем участников для каждой группы
            var members = groupService.getGroupMembers(group.getId());
            totalMembers += members.size();

            // Получаем файлы для каждой группы
            var files = fileService.getGroupFiles(group.getId());
            totalFiles += files.size();
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalGroups", groups.size());
        stats.put("totalMembers", totalMembers);
        stats.put("totalFiles", totalFiles);
        stats.put("totalStorageUsed", fileService.getUserStorageUsed(userId));

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/user/quick")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<DashboardStats> getUserQuickStats() {
        var currentUser = securityUtils.getCurrentUser();
        UUID userId = currentUser.getId();

        var groups = groupService.getUserGroups(userId);

        DashboardStats stats = new DashboardStats();
        stats.setTotalGroups(groups.size());
        stats.setTotalMembers(0);
        stats.setTotalFiles(0);

        // Оптимизированный подсчет
        for (var group : groups) {
            // Для подсчета участников используем репозиторий напрямую или добавляем метод в сервис
            stats.setTotalMembers(stats.getTotalMembers() + group.getMemberCount());
            stats.setTotalFiles(stats.getTotalFiles() + group.getFileCount());
        }

        return ResponseEntity.ok(stats);
    }

    static class DashboardStats {
        private int totalGroups;
        private int totalMembers;
        private int totalFiles;
        private Long totalStorageUsed;

        // Getters and Setters
        public int getTotalGroups() { return totalGroups; }
        public void setTotalGroups(int totalGroups) { this.totalGroups = totalGroups; }

        public int getTotalMembers() { return totalMembers; }
        public void setTotalMembers(int totalMembers) { this.totalMembers = totalMembers; }

        public int getTotalFiles() { return totalFiles; }
        public void setTotalFiles(int totalFiles) { this.totalFiles = totalFiles; }

        public Long getTotalStorageUsed() { return totalStorageUsed; }
        public void setTotalStorageUsed(Long totalStorageUsed) { this.totalStorageUsed = totalStorageUsed; }
    }
}