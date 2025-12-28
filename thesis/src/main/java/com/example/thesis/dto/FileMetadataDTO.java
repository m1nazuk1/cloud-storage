package com.example.thesis.dto;


import com.example.thesis.models.FileMetadata;

import java.time.LocalDateTime;
import java.util.UUID;

public class FileMetadataDTO {
    private UUID id;
    private String originalName;
    private String storedName;
    private Long fileSize;
    private String fileType;
    private String mimeType;
    private LocalDateTime uploadDate;
    private String uploaderUsername; // Только username вместо всего объекта User

    public FileMetadataDTO() {
    }

    public FileMetadataDTO(UUID id, String originalName, String storedName, Long fileSize, String fileType, String mimeType, LocalDateTime uploadDate, String uploaderUsername) {
        this.id = id;
        this.originalName = originalName;
        this.storedName = storedName;
        this.fileSize = fileSize;
        this.fileType = fileType;
        this.mimeType = mimeType;
        this.uploadDate = uploadDate;
        this.uploaderUsername = uploaderUsername;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getOriginalName() {
        return originalName;
    }

    public void setOriginalName(String originalName) {
        this.originalName = originalName;
    }

    public String getStoredName() {
        return storedName;
    }

    public void setStoredName(String storedName) {
        this.storedName = storedName;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public LocalDateTime getUploadDate() {
        return uploadDate;
    }

    public void setUploadDate(LocalDateTime uploadDate) {
        this.uploadDate = uploadDate;
    }

    public String getUploaderUsername() {
        return uploaderUsername;
    }

    public void setUploaderUsername(String uploaderUsername) {
        this.uploaderUsername = uploaderUsername;
    }

    public static FileMetadataDTO fromEntity(FileMetadata file) {
        return new FileMetadataDTO(
                file.getId(),
                file.getOriginalName(),
                file.getStoredName(),
                file.getFileSize(),
                file.getFileType(),
                file.getMimeType(),
                file.getUploadDate(),
                file.getUploader() != null ? file.getUploader().getUsername() : null
        );
    }
}