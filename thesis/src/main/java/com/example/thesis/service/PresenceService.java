package com.example.thesis.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {

    private static final long ONLINE_MS = 45_000;

    private final ConcurrentHashMap<UUID, ConcurrentHashMap<UUID, Long>> byGroup = new ConcurrentHashMap<>();
    private final SimpMessagingTemplate messagingTemplate;

    public PresenceService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void heartbeat(UUID groupId, UUID userId) {
        byGroup.computeIfAbsent(groupId, g -> new ConcurrentHashMap<>()).put(userId, System.currentTimeMillis());
        broadcast(groupId);
    }

    public List<UUID> getOnlineUserIds(UUID groupId) {
        long cutoff = System.currentTimeMillis() - ONLINE_MS;
        ConcurrentHashMap<UUID, Long> m = byGroup.get(groupId);
        if (m == null) {
            return List.of();
        }
        m.entrySet().removeIf(e -> e.getValue() < cutoff);
        return m.keySet().stream().sorted().toList();
    }

    private void broadcast(UUID groupId) {
        List<String> ids = getOnlineUserIds(groupId).stream().map(UUID::toString).toList();
        messagingTemplate.convertAndSend("/topic/group." + groupId + ".presence", ids);
    }
}
