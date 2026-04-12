package com.example.thesis.models;

import com.example.thesis.models.enums.StorageBackend;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "file_metadata")
public class FileMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "original_name", nullable = false)
    private String originalName;

    @Column(name = "stored_name", nullable = false, unique = true)
    private String storedName;

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_type")
    private String fileType;

    @Column(name = "mime_type")
    private String mimeType;

    @CreationTimestamp
    @Column(name = "upload_date", nullable = false, updatable = false)
    private LocalDateTime uploadDate;

    @Column(name = "last_modified")
    private LocalDateTime lastModified;

    /**
     * Оптимистическая блокировка: при каждом успешном изменении метаданных увеличивается.
     * Клиент передаёт ожидаемую версию при переименовании/удалении — при расхождении 409 Conflict.
     */
    @Version
    @Column(name = "version", nullable = false)
    private Integer version = 1;

    /** Где физически лежат байты файла (гибридное облако). */
    @Enumerated(EnumType.STRING)
    @Column(name = "storage_backend", nullable = false, length = 32, columnDefinition = "varchar(32) default 'LOCAL'")
    private StorageBackend storageBackend = StorageBackend.LOCAL;

    /** Ключ объекта в S3/MinIO; для LOCAL не используется. */
    @Column(name = "object_key")
    private String objectKey;

    @Column(name = "is_deleted")
    private boolean deleted = false;

    /** Файл загружен в чат — не показывать в списке файлов группы */
    @Column(name = "chat_media", nullable = false)
    private boolean chatMedia = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = false)
    private User uploader;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private WorkGroup parentGroup;

    @JsonIgnore
    @OneToOne(mappedBy = "attachment", cascade = CascadeType.ALL)
    private ChatMessage chatMessage;

    @JsonIgnore
    @OneToMany(mappedBy = "file", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<FileHistory> history = new HashSet<>();

    public FileMetadata() {
        this.history = new HashSet<>();
    }

    public FileMetadata(String originalName, String storedName, User uploader, WorkGroup parentGroup) {
        this();
        this.originalName = originalName;
        this.storedName = storedName;
        this.uploader = uploader;
        this.parentGroup = parentGroup;
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

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
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

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public StorageBackend getStorageBackend() {
        return storageBackend;
    }

    public void setStorageBackend(StorageBackend storageBackend) {
        this.storageBackend = storageBackend;
    }

    public String getObjectKey() {
        return objectKey;
    }

    public void setObjectKey(String objectKey) {
        this.objectKey = objectKey;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }

    public boolean isChatMedia() {
        return chatMedia;
    }

    public void setChatMedia(boolean chatMedia) {
        this.chatMedia = chatMedia;
    }

    public User getUploader() {
        return uploader;
    }

    public void setUploader(User uploader) {
        this.uploader = uploader;
    }

    @JsonIgnore
    public WorkGroup getParentGroup() {
        return parentGroup;
    }

    public void setParentGroup(WorkGroup parentGroup) {
        this.parentGroup = parentGroup;
    }

    public UUID getGroupId() {
        return parentGroup != null ? parentGroup.getId() : null;
    }

    @JsonIgnore
    public ChatMessage getChatMessage() {
        return chatMessage;
    }

    public void setChatMessage(ChatMessage chatMessage) {
        this.chatMessage = chatMessage;
    }

    @JsonIgnore
    public Set<FileHistory> getHistory() {
        return history;
    }

    public void setHistory(Set<FileHistory> history) {
        this.history = history;
    }

    public String getFormattedSize() {
        if (fileSize == null) return "0 B";

        if (fileSize < 1024) {
            return fileSize + " B";
        } else if (fileSize < 1024 * 1024) {
            return String.format("%.1f KB", fileSize / 1024.0);
        } else if (fileSize < 1024 * 1024 * 1024) {
            return String.format("%.1f MB", fileSize / (1024.0 * 1024.0));
        } else {
            return String.format("%.1f GB", fileSize / (1024.0 * 1024.0 * 1024.0));
        }
    }

    public String getFileExtension() {
        if (originalName == null) return "";
        int lastDotIndex = originalName.lastIndexOf('.');
        if (lastDotIndex > 0) {
            return originalName.substring(lastDotIndex + 1).toLowerCase();
        }
        return "";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FileMetadata that = (FileMetadata) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "FileMetadata{" +
                "id=" + id +
                ", originalName='" + originalName + '\'' +
                ", fileSize=" + fileSize +
                ", uploader=" + (uploader != null ? uploader.getUsername() : "null") +
                '}';
    }
}