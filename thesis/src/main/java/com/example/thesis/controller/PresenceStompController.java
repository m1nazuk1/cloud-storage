package com.example.thesis.controller;

import com.example.thesis.repository.MembershipRepository;
import com.example.thesis.security.SecurityUtils;
import com.example.thesis.service.PresenceService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.util.UUID;

@Controller
public class PresenceStompController {

    private final PresenceService presenceService;
    private final SecurityUtils securityUtils;
    private final MembershipRepository membershipRepository;

    public PresenceStompController(PresenceService presenceService,
                                   SecurityUtils securityUtils,
                                   MembershipRepository membershipRepository) {
        this.presenceService = presenceService;
        this.securityUtils = securityUtils;
        this.membershipRepository = membershipRepository;
    }

    @MessageMapping("/presence.ping/{groupId}")
    public void ping(@DestinationVariable UUID groupId) {
        var user = securityUtils.getCurrentUser();
        if (user == null) {
            return;
        }
        if (!membershipRepository.isUserMemberOfGroup(user.getId(), groupId)) {
            return;
        }
        presenceService.heartbeat(groupId, user.getId());
    }
}
