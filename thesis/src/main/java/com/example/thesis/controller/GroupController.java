package com.example.thesis.controller;

import com.example.thesis.dto.GroupCreateRequest;
import com.example.thesis.dto.GroupUpdateRequest;
import com.example.thesis.models.User;
import com.example.thesis.models.WorkGroup;
import com.example.thesis.security.SecurityUtils;
import com.example.thesis.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/group")
@CrossOrigin(origins = "*", maxAge = 3600)
public class GroupController {

    private final GroupService groupService;
    private final SecurityUtils securityUtils;

    public GroupController(GroupService groupService, SecurityUtils securityUtils) {
        this.groupService = groupService;
        this.securityUtils = securityUtils;
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<WorkGroup> createGroup(@Valid @RequestBody GroupCreateRequest request) {
        System.out.println("[INFO] Creating group: " + request.getName());

        User currentUser = securityUtils.getCurrentUser();
        WorkGroup group = groupService.createGroup(request, currentUser);

        System.out.println("[INFO] Group created with ID: " + group.getId());
        return ResponseEntity.ok(group);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<WorkGroup>> getMyGroups() {
        User currentUser = securityUtils.getCurrentUser();
        System.out.println("[INFO] Getting groups for user: " + currentUser.getUsername());

        List<WorkGroup> groups = groupService.getUserGroups(currentUser.getId());
        System.out.println("[INFO] Found " + groups.size() + " groups for user: " + currentUser.getUsername());

        return ResponseEntity.ok(groups);
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
    public ResponseEntity<WorkGroup> getGroup(@PathVariable UUID id) {
        WorkGroup group = groupService.getGroupById(id);
        // Проверяем, является ли пользователь участником группы
        if (!groupService.isUserMember(id, securityUtils.getCurrentUserId())) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(group);
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
    public ResponseEntity<GroupStats> getGroupStats(@PathVariable UUID id) {
        if (!groupService.isUserMember(id, securityUtils.getCurrentUserId())) {
            return ResponseEntity.status(403).build();
        }

        WorkGroup group = groupService.getGroupById(id);
        List<User> members = groupService.getGroupMembers(id);

        GroupStats stats = new GroupStats();
        stats.setMemberCount(members.size());
        stats.setCreatedDate(group.getCreationDate());
        stats.setCreator(group.getCreator().getUsername());

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