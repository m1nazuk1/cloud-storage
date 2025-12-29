package com.example.thesis.controller;

import com.example.thesis.dto.GroupCreateRequest;
import com.example.thesis.dto.GroupDTO;
import com.example.thesis.dto.GroupUpdateRequest;
import com.example.thesis.dto.GroupWithStats;
import com.example.thesis.models.FileMetadata;
import com.example.thesis.models.User;
import com.example.thesis.models.WorkGroup;
import com.example.thesis.repository.UserRepository;
import com.example.thesis.security.SecurityUtils;
import com.example.thesis.service.GroupService;
import com.example.thesis.service.impl.FileServiceImpl;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/group")
@CrossOrigin(origins = "*", maxAge = 3600)
public class GroupController {

    private final GroupService groupService;
    private final SecurityUtils securityUtils;
    private final FileServiceImpl fileService;
    private final UserRepository userRepository;

    public GroupController(GroupService groupService, SecurityUtils securityUtils, FileServiceImpl fileService, UserRepository userRepository) {
        this.groupService = groupService;
        this.securityUtils = securityUtils;
        this.fileService = fileService;
        this.userRepository = userRepository;
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<User> getCurrentUserProfile() {
        User currentUser = securityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.notFound().build();
        }

        // Перезагружаем пользователя с полной информацией
        User refreshedUser = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(refreshedUser);
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<GroupDTO> createGroup(@Valid @RequestBody GroupCreateRequest request) {
        System.out.println("[INFO] Creating group: " + request.getName());

        User currentUser = securityUtils.getCurrentUser();
        WorkGroup group = groupService.createGroup(request, currentUser);

        // Конвертируем в DTO
        GroupDTO groupDTO = GroupDTO.fromEntity(group);

        System.out.println("[INFO] Group created with ID: " + group.getId());
        return ResponseEntity.ok(groupDTO);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<GroupWithStats>> getMyGroups() {
        User currentUser = securityUtils.getCurrentUser();
        System.out.println("[INFO] Getting groups for user: " + currentUser.getUsername());

        List<WorkGroup> groups = groupService.getUserGroups(currentUser.getId());

        // Конвертируем в DTO с правильной статистикой
        List<GroupWithStats> dtos = new ArrayList<>();
        for (WorkGroup group : groups) {
            // Получаем реальное количество участников
            int memberCount = group.getMemberships() != null ? group.getMemberships().size() : 0;

            // Получаем реальное количество файлов (не удаленных)
            int fileCount = 0;
            if (group.getFiles() != null) {
                fileCount = (int) group.getFiles().stream()
                        .filter(f -> !f.isDeleted())
                        .count();
            }

            dtos.add(GroupWithStats.fromEntity(group, memberCount, fileCount));
        }

        System.out.println("[INFO] Found " + dtos.size() + " groups for user: " + currentUser.getUsername());

        return ResponseEntity.ok(dtos);
    }



    @PostMapping("/join")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> joinGroupByToken(@RequestBody Map<String, String> request) {
        User currentUser = securityUtils.getCurrentUser();
        String token = request.get("token");

        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Token is required");
        }

        try {
            groupService.joinGroup(token, currentUser);
            return ResponseEntity.ok(new AuthController.MessageResponse("Successfully joined group"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/full")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getGroupFull(@PathVariable UUID id) {
        WorkGroup group = groupService.getGroupById(id);

        // Проверяем, является ли пользователь участником группы
        if (!groupService.isUserMember(id, securityUtils.getCurrentUserId())) {
            return ResponseEntity.status(403).build();
        }

        // Создаем структуру данных вручную
        Map<String, Object> response = new HashMap<>();
        response.put("id", group.getId());
        response.put("name", group.getName());
        response.put("description", group.getDescription());
        response.put("creationDate", group.getCreationDate());
        response.put("creator", Map.of(
                "id", group.getCreator().getId(),
                "username", group.getCreator().getUsername(),
                "email", group.getCreator().getEmail()
        ));

        // Добавляем файлы
        List<Map<String, Object>> files = group.getFiles().stream()
                .filter(f -> !f.isDeleted())
                .map(f -> Map.of(
                        "id", f.getId(),
                        "name", f.getOriginalName(),
                        "size", f.getFileSize(),
                        "uploadDate", f.getUploadDate(),
                        "uploader", Map.of(
                                "id", f.getUploader().getId(),
                                "username", f.getUploader().getUsername()
                        )
                ))
                .collect(Collectors.toList());
        response.put("files", files);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/created")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<WorkGroup>> getCreatedGroups() {
        User currentUser = securityUtils.getCurrentUser();
        List<WorkGroup> groups = groupService.getUserCreatedGroups(currentUser.getId());
        return ResponseEntity.ok(groups);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<GroupDTO> getGroup(@PathVariable UUID id) {
        WorkGroup group = groupService.getGroupById(id);

        // Проверяем, является ли пользователь участником группы
        if (!groupService.isUserMember(id, securityUtils.getCurrentUserId())) {
            return ResponseEntity.status(403).build();
        }

        // Конвертируем в DTO с полной информацией
        GroupDTO groupDTO = GroupDTO.fromEntity(group);

        return ResponseEntity.ok(groupDTO);
    }



    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<WorkGroup> updateGroup(@PathVariable UUID id,
                                                 @Valid @RequestBody GroupUpdateRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        WorkGroup updatedGroup = groupService.updateGroup(id, request, currentUser);
        return ResponseEntity.ok(updatedGroup);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteGroup(@PathVariable UUID id) {
        User currentUser = securityUtils.getCurrentUser();
        groupService.deleteGroup(id, currentUser);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/invite-token")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<String> getInviteToken(@PathVariable UUID id) {
        User currentUser = securityUtils.getCurrentUser();
        String token = groupService.generateInviteToken(id, currentUser);
        return ResponseEntity.ok(token);
    }

    @PostMapping("/join/{token}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> joinGroup(@PathVariable String token) {
        User currentUser = securityUtils.getCurrentUser();
        groupService.joinGroup(token, currentUser);
        return ResponseEntity.ok(new AuthController.MessageResponse("Successfully joined group"));
    }



    @GetMapping("/{id}/members")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<User>> getGroupMembers(@PathVariable UUID id) {
        // Проверяем, является ли пользователь участником группы
        if (!groupService.isUserMember(id, securityUtils.getCurrentUserId())) {
            return ResponseEntity.status(403).build();
        }
        List<User> members = groupService.getGroupMembers(id);
        return ResponseEntity.ok(members);
    }

    @PostMapping("/{groupId}/members/{userId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> addMember(@PathVariable UUID groupId,
                                       @PathVariable UUID userId) {
        User currentUser = securityUtils.getCurrentUser();
        groupService.addMember(groupId, userId, currentUser);
        return ResponseEntity.ok(new AuthController.MessageResponse("Member added successfully"));
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> removeMember(@PathVariable UUID groupId,
                                          @PathVariable UUID userId) {
        User currentUser = securityUtils.getCurrentUser();
        groupService.removeMember(groupId, userId, currentUser);
        return ResponseEntity.ok(new AuthController.MessageResponse("Member removed successfully"));
    }

    @PutMapping("/{groupId}/members/{userId}/role")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> changeMemberRole(@PathVariable UUID groupId,
                                              @PathVariable UUID userId,
                                              @RequestParam String role) {
        User currentUser = securityUtils.getCurrentUser();
        groupService.changeMemberRole(groupId, userId, role, currentUser);
        return ResponseEntity.ok(new AuthController.MessageResponse("Role updated successfully"));
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<WorkGroup>> searchGroups(@RequestParam String query) {
        User currentUser = securityUtils.getCurrentUser();
        List<WorkGroup> groups = groupService.searchGroups(query, currentUser.getId());
        return ResponseEntity.ok(groups);
    }

    @GetMapping("/{id}/stats")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getGroupStats(@PathVariable UUID id) {
        if (!groupService.isUserMember(id, securityUtils.getCurrentUserId())) {
            return ResponseEntity.status(403).build();
        }

        WorkGroup group = groupService.getGroupById(id);

        // Получаем участников
        List<User> members = groupService.getGroupMembers(id);

        // Получаем файлы
        List<FileMetadata> files = fileService.getGroupFiles(id);

        Map<String, Object> stats = new HashMap<>();
        stats.put("id", group.getId());
        stats.put("name", group.getName());
        stats.put("memberCount", members.size());
        stats.put("fileCount", files.size());
        stats.put("creator", group.getCreator().getUsername());
        stats.put("creationDate", group.getCreationDate());

        return ResponseEntity.ok(stats);
    }

    static class GroupStats {
        private int memberCount;
        private java.time.LocalDateTime createdDate;
        private String creator;

        // Getters and Setters
        public int getMemberCount() { return memberCount; }
        public void setMemberCount(int memberCount) { this.memberCount = memberCount; }

        public java.time.LocalDateTime getCreatedDate() { return createdDate; }
        public void setCreatedDate(java.time.LocalDateTime createdDate) { this.createdDate = createdDate; }

        public String getCreator() { return creator; }
        public void setCreator(String creator) { this.creator = creator; }
    }
}