package com.example.thesis.dto;

import com.example.thesis.models.User;

import java.time.LocalDateTime;
import java.util.UUID;

public class GroupWithStats {
    private UUID id;
    private String name;
    private String description;
    private String inviteToken;
    private LocalDateTime creationDate;
    private String creatorUsername;
    private User creator;
    private int memberCount;
    private int fileCount;

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

    public String getInviteToken() {
        return inviteToken;
    }

    public void setInviteToken(String inviteToken) {
        this.inviteToken = inviteToken;
    }

    public LocalDateTime getCreationDate() {
        return creationDate;
    }

    public void setCreationDate(LocalDateTime creationDate) {
        this.creationDate = creationDate;
    }

    public User getCreator() {
        return creator;
    }

    public void setCreator(User creator) {
        this.creator = creator;
    }

    public int getMemberCount() {
        return memberCount;
    }

    public void setMemberCount(int memberCount) {
        this.memberCount = memberCount;
    }

    public int getFileCount() {
        return fileCount;
    }

    public void setFileCount(int fileCount) {
        this.fileCount = fileCount;
    }

    public String getCreatorUsername() {
        return creatorUsername;
    }

    public void setCreatorUsername(String creatorUsername) {
        this.creatorUsername = creatorUsername;
    }

    public GroupWithStats(UUID id, String name, String description, String inviteToken, LocalDateTime creationDate, String creatorUsername, User creator, int memberCount, int fileCount) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.inviteToken = inviteToken;
        this.creationDate = creationDate;
        this.creatorUsername = creatorUsername;
        this.creator = creator;
        this.memberCount = memberCount;
        this.fileCount = fileCount;
    }

    public GroupWithStats() {
    }

    public static GroupWithStats fromEntity(com.example.thesis.models.WorkGroup group,
                                            int memberCount,
                                            int fileCount) {
        GroupWithStats dto = new GroupWithStats();
        dto.setId(group.getId());
        dto.setName(group.getName());
        dto.setDescription(group.getDescription());
        dto.setCreationDate(group.getCreationDate());
        dto.setCreatorUsername(group.getCreator() != null ? group.getCreator().getUsername() : "Unknown");
        dto.setMemberCount(memberCount);
        dto.setFileCount(fileCount);
        return dto;
    }
}