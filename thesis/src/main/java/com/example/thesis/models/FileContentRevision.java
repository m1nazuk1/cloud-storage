package com.example.thesis.models;

import com.example.thesis.models.enums.StorageBackend;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "file_content_revision")
public class FileContentRevision {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "file_id", nullable = false)
    private FileMetadata file;

    /** JPA @Version value this snapshot represents (content before next save). */
    @Column(name = "file_version_snapshot", nullable = false)
    private int fileVersionSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(name = "storage_backend", nullable = false, length = 32)
    private StorageBackend storageBackend;

    @Column(name = "storage_key", nullable = false, length = 1024)
    private String storageKey;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "mime_type", length = 255)
    private String mimeType;

    @Column(name = "original_name_snapshot", nullable = false, length = 512)
    private String originalNameSnapshot;

    @Column(name = "text_snapshot", columnDefinition = "TEXT")
    private String textSnapshot;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public FileMetadata getFile() {
        return file;
    }

    public void setFile(FileMetadata file) {
        this.file = file;
    }

    public int getFileVersionSnapshot() {
        return fileVersionSnapshot;
    }

    public void setFileVersionSnapshot(int fileVersionSnapshot) {
        this.fileVersionSnapshot = fileVersionSnapshot;
    }

    public StorageBackend getStorageBackend() {
        return storageBackend;
    }

    public void setStorageBackend(StorageBackend storageBackend) {
        this.storageBackend = storageBackend;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
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

    public String getTextSnapshot() {
        return textSnapshot;
    }

    public void setTextSnapshot(String textSnapshot) {
        this.textSnapshot = textSnapshot;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
