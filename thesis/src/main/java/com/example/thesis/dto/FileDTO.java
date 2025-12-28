package com.example.thesis.dto;

import com.example.thesis.models.FileMetadata;

import java.time.LocalDateTime;
import java.util.UUID;

public class FileDTO {
    private UUID id;
    private String originalName;
    private Long fileSize;
    private String fileType;
    private String mimeType;
    private LocalDateTime uploadDate;
    private String uploaderUsername;
    private String formattedSize;

    public FileDTO() {
    }

    public FileDTO(UUID id, String originalName, Long fileSize, String fileType, String mimeType, LocalDateTime uploadDate, String uploaderUsername, String formattedSize) {
        this.id = id;
        this.originalName = originalName;
        this.fileSize = fileSize;
        this.fileType = fileType;
        this.mimeType = mimeType;
        this.uploadDate = uploadDate;
        this.uploaderUsername = uploaderUsername;
        this.formattedSize = formattedSize;
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

    public String getFormattedSize() {
        return formattedSize;
    }

    public void setFormattedSize(String formattedSize) {
        this.formattedSize = formattedSize;
    }

    public static FileDTO fromEntity(FileMetadata file) {
        FileDTO dto = new FileDTO();
        dto.setId(file.getId());
        dto.setOriginalName(file.getOriginalName());
        dto.setFileSize(file.getFileSize());
        dto.setFileType(file.getFileType());
        dto.setMimeType(file.getMimeType());
        dto.setUploadDate(file.getUploadDate());
        dto.setUploaderUsername(file.getUploader() != null ? file.getUploader().getUsername() : "Unknown");
        dto.setFormattedSize(file.getFormattedSize());
        return dto;
    }
}