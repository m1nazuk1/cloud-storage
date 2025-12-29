package com.example.thesis.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class GroupDTO {
    private UUID id;
    private String name;
    private String description;
    private LocalDateTime creationDate;
    private String creatorUsername;
    private int fileCount;
    private int memberCount;
    private String inviteToken;


    public GroupDTO() {
    }

    public GroupDTO(UUID id, String name, String description, LocalDateTime creationDate, String creatorUsername, int fileCount, int memberCount) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.creationDate = creationDate;
        this.creatorUsername = creatorUsername;
        this.fileCount = fileCount;
        this.memberCount = memberCount;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreationDate() {
        return creationDate;
    }

    public void setCreationDate(LocalDateTime creationDate) {
        this.creationDate = creationDate;
    }

    public String getCreatorUsername() {
        return creatorUsername;
    }

    public void setCreatorUsername(String creatorUsername) {
        this.creatorUsername = creatorUsername;
    }

    public int getFileCount() {
        return fileCount;
    }

    public void setFileCount(int fileCount) {
        this.fileCount = fileCount;
    }

    public int getMemberCount() {
        return memberCount;
    }

    public void setMemberCount(int memberCount) {
        this.memberCount = memberCount;
    }

    public String getInviteToken() {
        return inviteToken;
    }

    public void setInviteToken(String inviteToken) {
        this.inviteToken = inviteToken;
    }

    public static GroupDTO fromEntity(com.example.thesis.models.WorkGroup group) {
        GroupDTO dto = new GroupDTO();
        dto.setId(group.getId());
        dto.setName(group.getName());
        dto.setDescription(group.getDescription());
        dto.setCreationDate(group.getCreationDate());
        dto.setCreatorUsername(group.getCreator() != null ? group.getCreator().getUsername() : "Unknown");
        dto.setInviteToken(group.getInviteToken());

        // Правильный подсчет
        if (group.getMemberships() != null) {
            dto.setMemberCount(group.getMemberships().size());
        } else {
            dto.setMemberCount(0);
        }

        if (group.getFiles() != null) {
            dto.setFileCount((int) group.getFiles().stream()
                    .filter(f -> !f.isDeleted())
                    .count());
        } else {
            dto.setFileCount(0);
        }

        return dto;
    }

    // Для списка групп (только основные данные)
    public static GroupDTO fromEntitySimple(com.example.thesis.models.WorkGroup group) {
        GroupDTO dto = new GroupDTO();
        dto.setId(group.getId());
        dto.setName(group.getName());
        dto.setDescription(group.getDescription());
        dto.setCreationDate(group.getCreationDate());
        dto.setCreatorUsername(group.getCreator() != null ? group.getCreator().getUsername() : "Unknown");

        // Для простого DTO мы не загружаем связанные данные
        // Будем получать counts отдельными запросами
        dto.setMemberCount(0);
        dto.setFileCount(0);

        return dto;
    }

}