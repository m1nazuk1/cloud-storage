package com.example.thesis.controller;

import com.example.thesis.models.FileHistory;
import com.example.thesis.models.User;
import com.example.thesis.models.WorkGroup;
import com.example.thesis.repository.FileHistoryRepository;
import com.example.thesis.security.SecurityUtils;
import com.example.thesis.service.GroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/activity")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ActivityController {

    private final FileHistoryRepository fileHistoryRepository;
    private final SecurityUtils securityUtils;
    private final GroupService groupService;

    public ActivityController(FileHistoryRepository fileHistoryRepository,
                              SecurityUtils securityUtils,
                              GroupService groupService) {
        this.fileHistoryRepository = fileHistoryRepository;
        this.securityUtils = securityUtils;
        this.groupService = groupService;
    }

    @GetMapping("/recent")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<ActivityDTO>> getRecentActivity() {
        User currentUser = securityUtils.getCurrentUser();

        // Получаем все группы пользователя
        List<WorkGroup> userGroups = groupService.getUserGroups(currentUser.getId());

        List<ActivityDTO> activities = new ArrayList<>();

        for (WorkGroup group : userGroups) {
            // Получаем последние 5 событий для каждой группы
            List<FileHistory> groupHistory = fileHistoryRepository.findByGroupId(group.getId());

            for (FileHistory history : groupHistory.stream()
                    .sorted((h1, h2) -> h2.getChangeDate().compareTo(h1.getChangeDate()))
                    .limit(5)
                    .collect(Collectors.toList())) {

                ActivityDTO activity = new ActivityDTO();
                activity.setId(history.getId());
                activity.setType(history.getChangeType().toString());
                activity.setMessage(generateActivityMessage(history));
                activity.setCreatedDate(history.getChangeDate());
                activity.setGroupId(group.getId());
                activity.setGroupName(group.getName());
                activity.setUserId(history.getChangedBy().getId());
                activity.setUserName(history.getChangedBy().getUsername());

                if (history.getFile() != null) {
                    activity.setFileId(history.getFile().getId());
                    activity.setFileName(history.getFile().getOriginalName());
                }

                activities.add(activity);
            }
        }

        // Сортируем по дате и берем 10 последних
        activities.sort((a1, a2) -> a2.getCreatedDate().compareTo(a1.getCreatedDate()));
        List<ActivityDTO> recentActivities = activities.stream()
                .limit(10)
                .collect(Collectors.toList());

        return ResponseEntity.ok(recentActivities);
    }

    private String generateActivityMessage(FileHistory history) {
        switch (history.getChangeType()) {
            case UPLOADED:
                return history.getChangedBy().getUsername() + " uploaded " +
                        history.getFile().getOriginalName();
            case DELETED:
                return history.getChangedBy().getUsername() + " deleted " +
                        (history.getAdditionalInfo() != null ?
                                history.getAdditionalInfo() : "a file");
            case RENAMED:
                return history.getChangedBy().getUsername() + " renamed a file";
            case DOWNLOADED:
                return history.getChangedBy().getUsername() + " downloaded " +
                        history.getFile().getOriginalName();
            default:
                return history.getChangedBy().getUsername() + " performed an action";
        }
    }


    public static class ActivityDTO {
        private UUID id;
        private String type;
        private String message;
        private LocalDateTime createdDate;
        private UUID groupId;
        private String groupName;
        private UUID userId;
        private String userName;
        private UUID fileId;
        private String fileName;

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public LocalDateTime getCreatedDate() {
            return createdDate;
        }

        public void setCreatedDate(LocalDateTime createdDate) {
            this.createdDate = createdDate;
        }

        public UUID getGroupId() {
            return groupId;
        }

        public void setGroupId(UUID groupId) {
            this.groupId = groupId;
        }

        public String getGroupName() {
            return groupName;
        }

        public void setGroupName(String groupName) {
            this.groupName = groupName;
        }

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

        public String getUserName() {
            return userName;
        }

        public void setUserName(String userName) {
            this.userName = userName;
        }

        public UUID getFileId() {
            return fileId;
        }

        public void setFileId(UUID fileId) {
            this.fileId = fileId;
        }

        public String getFileName() {
            return fileName;
        }

        public void setFileName(String fileName) {
            this.fileName = fileName;
        }

        public ActivityDTO() {
        }

        public ActivityDTO(UUID id, String type, String message, LocalDateTime createdDate, UUID groupId, String groupName, UUID userId, String userName, UUID fileId, String fileName) {
            this.id = id;
            this.type = type;
            this.message = message;
            this.createdDate = createdDate;
            this.groupId = groupId;
            this.groupName = groupName;
            this.userId = userId;
            this.userName = userName;
            this.fileId = fileId;
            this.fileName = fileName;
        }
    }
}