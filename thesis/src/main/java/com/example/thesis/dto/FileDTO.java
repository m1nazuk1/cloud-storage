package com.example.thesis.dto;

import com.example.thesis.models.FileMetadata;
import com.example.thesis.models.User;
import com.example.thesis.models.enums.StorageBackend;

import java.time.LocalDateTime;
import java.util.UUID;

public class FileDTO {
    private UUID id;
    private String originalName;
    private Long fileSize;
    private String fileType;
    private String mimeType;
    private LocalDateTime uploadDate;
    private LocalDateTime lastModified;
    private String formattedSize;
    
    private PublicUser uploader;

    
    private Integer version;

    
    private String storageBackend;

    public static class PublicUser {
        private UUID id;
        private String username;
        private String email;
        private String firstName;
        private String lastName;

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getFirstName() {
            return firstName;
        }

        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public void setLastName(String lastName) {
            this.lastName = lastName;
        }
    }

    public static PublicUser fromUser(User user) {
        if (user == null) {
            return null;
        }
        PublicUser p = new PublicUser();
        p.setId(user.getId());
        p.setUsername(user.getUsername());
        p.setEmail(user.getEmail());
        p.setFirstName(user.getFirstName());
        p.setLastName(user.getLastName());
        return p;
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

    public LocalDateTime getLastModified() {
        return lastModified;
    }

    public void setLastModified(LocalDateTime lastModified) {
        this.lastModified = lastModified;
    }

    public PublicUser getUploader() {
        return uploader;
    }

    public void setUploader(PublicUser uploader) {
        this.uploader = uploader;
    }

    public String getFormattedSize() {
        return formattedSize;
    }

    public void setFormattedSize(String formattedSize) {
        this.formattedSize = formattedSize;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public String getStorageBackend() {
        return storageBackend;
    }

    public void setStorageBackend(String storageBackend) {
        this.storageBackend = storageBackend;
    }

    public static FileDTO fromEntity(FileMetadata file) {
        FileDTO dto = new FileDTO();
        dto.setId(file.getId());
        dto.setOriginalName(file.getOriginalName());
        dto.setFileSize(file.getFileSize());
        dto.setFileType(file.getFileType());
        dto.setMimeType(file.getMimeType());
        dto.setUploadDate(file.getUploadDate());
        dto.setLastModified(file.getLastModified());
        dto.setFormattedSize(file.getFormattedSize());
        dto.setUploader(fromUser(file.getUploader()));
        dto.setVersion(file.getVersion());
        StorageBackend sb = file.getStorageBackend();
        dto.setStorageBackend(sb != null ? sb.name() : StorageBackend.LOCAL.name());
        return dto;
    }
}
