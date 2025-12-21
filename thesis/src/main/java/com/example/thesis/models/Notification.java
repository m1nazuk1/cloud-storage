package com.example.thesis.models;

import com.example.thesis.models.enums.NotificationType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @CreationTimestamp
    @Column(name = "created_date", nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "read_date")
    private LocalDateTime readDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private WorkGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_file_id")
    private FileMetadata relatedFile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_user_id")
    private User relatedUser;

    public Notification() {
    }

    public Notification(NotificationType type, String message, User user, WorkGroup group) {
        this.type = type;
        this.message = message;
        this.user = user;
        this.group = group;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
        if (read && this.readDate == null) {
            this.readDate = LocalDateTime.now();
        }
    }

    public LocalDateTime getReadDate() {
        return readDate;
    }

    public void setReadDate(LocalDateTime readDate) {
        this.readDate = readDate;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public WorkGroup getGroup() {
        return group;
    }

    public void setGroup(WorkGroup group) {
        this.group = group;
    }

    public FileMetadata getRelatedFile() {
        return relatedFile;
    }

    public void setRelatedFile(FileMetadata relatedFile) {
        this.relatedFile = relatedFile;
    }

    public User getRelatedUser() {
        return relatedUser;
    }

    public void setRelatedUser(User relatedUser) {
        this.relatedUser = relatedUser;
    }

    public String getTimeAgo() {
        if (createdDate == null) return "";

        LocalDateTime now = LocalDateTime.now();
        long seconds = java.time.Duration.between(createdDate, now).getSeconds();

        if (seconds < 60) {
            return seconds + " секунд назад";
        } else if (seconds < 3600) {
            return seconds / 60 + " минут назад";
        } else if (seconds < 86400) {
            return seconds / 3600 + " часов назад";
        } else {
            return seconds / 86400 + " дней назад";
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Notification that = (Notification) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Notification{" +
                "id=" + id +
                ", type=" + type +
                ", message='" + message + '\'' +
                ", user=" + (user != null ? user.getUsername() : "null") +
                ", read=" + read +
                '}';
    }
}