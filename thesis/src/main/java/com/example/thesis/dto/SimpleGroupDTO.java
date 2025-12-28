package com.example.thesis.dto;

import com.example.thesis.models.WorkGroup;

import java.time.LocalDateTime;
import java.util.UUID;

public class SimpleGroupDTO {
    private UUID id;
    private String name;
    private String description;
    private LocalDateTime creationDate;
    private String creatorUsername;
    private int fileCount;
    private int memberCount;

    public SimpleGroupDTO() {
    }

    public SimpleGroupDTO(UUID id, String name, String description, LocalDateTime creationDate, String creatorUsername, int fileCount, int memberCount) {
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

    public static SimpleGroupDTO fromEntity(WorkGroup group) {
        return new SimpleGroupDTO(
                group.getId(),
                group.getName(),
                group.getDescription(),
                group.getCreationDate(),
                group.getCreator().getUsername(),
                group.getFiles().size(),
                group.getMemberships().size()
        );
    }
}