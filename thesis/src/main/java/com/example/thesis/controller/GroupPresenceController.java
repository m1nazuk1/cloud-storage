package com.example.thesis.controller;

import com.example.thesis.repository.MembershipRepository;
import com.example.thesis.security.SecurityUtils;
import com.example.thesis.service.PresenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/group")
@CrossOrigin(origins = "*", maxAge = 3600)
public class GroupPresenceController {

    private final PresenceService presenceService;
    private final SecurityUtils securityUtils;
    private final MembershipRepository membershipRepository;

    public GroupPresenceController(PresenceService presenceService,
                                   SecurityUtils securityUtils,
                                   MembershipRepository membershipRepository) {
        this.presenceService = presenceService;
        this.securityUtils = securityUtils;
        this.membershipRepository = membershipRepository;
    }

    @GetMapping("/{groupId}/online")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, List<String>>> getOnlineUsers(@PathVariable UUID groupId) {
        var user = securityUtils.getCurrentUser();
        if (!membershipRepository.isUserMemberOfGroup(user.getId(), groupId)) {
            return ResponseEntity.status(403).build();
        }
        List<String> ids = presenceService.getOnlineUserIds(groupId).stream()
                .map(UUID::toString)
                .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("userIds", ids));
    }
}
