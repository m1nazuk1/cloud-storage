package com.example.thesis.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class FileRevisionDto {
    private UUID id;
    private int fileVersionSnapshot;
    private long sizeBytes;
    private String mimeType;
    private String originalNameSnapshot;
    private boolean hasTextSnapshot;
    private LocalDateTime createdAt;
    private UUID createdById;
    private String createdByUsername;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public int getFileVersionSnapshot() {
        return fileVersionSnapshot;
    }

    public void setFileVersionSnapshot(int fileVersionSnapshot) {
        this.fileVersionSnapshot = fileVersionSnapshot;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public String getOriginalNameSnapshot() {
        return originalNameSnapshot;
    }

    public void setOriginalNameSnapshot(String originalNameSnapshot) {
        this.originalNameSnapshot = originalNameSnapshot;
    }

    public boolean isHasTextSnapshot() {
        return hasTextSnapshot;
    }

    public void setHasTextSnapshot(boolean hasTextSnapshot) {
        this.hasTextSnapshot = hasTextSnapshot;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public UUID getCreatedById() {
        return createdById;
    }

    public void setCreatedById(UUID createdById) {
        this.createdById = createdById;
    }

    public String getCreatedByUsername() {
        return createdByUsername;
    }

    public void setCreatedByUsername(String createdByUsername) {
        this.createdByUsername = createdByUsername;
    }
}
