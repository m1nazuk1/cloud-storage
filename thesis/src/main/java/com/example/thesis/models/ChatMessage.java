package com.example.thesis.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(columnDefinition = "TEXT")
    private String content;

    /** TEXT, IMAGE, AUDIO, STICKER, FILE */
    @Column(name = "message_kind", length = 32, nullable = false)
    private String messageKind = "TEXT";

    @CreationTimestamp
    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private WorkGroup group;

    @OneToOne
    @JoinColumn(name = "attachment_id")
    private FileMetadata attachment;

    @Column(name = "is_edited")
    private boolean edited = false;

    @Column(name = "edit_timestamp")
    private LocalDateTime editTimestamp;

    public ChatMessage() {
    }

    public ChatMessage(String content, User sender, WorkGroup group) {
        this.content = content;
        this.sender = sender;
        this.group = group;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getMessageKind() {
        return messageKind;
    }

    public void setMessageKind(String messageKind) {
        this.messageKind = messageKind != null ? messageKind : "TEXT";
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public User getSender() {
        return sender;
    }

    public void setSender(User sender) {
        this.sender = sender;
    }

    @JsonIgnore
    public WorkGroup getGroup() {
        return group;
    }

    public void setGroup(WorkGroup group) {
        this.group = group;
    }

    /** В JSON вместо целого WorkGroup */
    public UUID getGroupId() {
        return group != null ? group.getId() : null;
    }

    public FileMetadata getAttachment() {
        return attachment;
    }

    public void setAttachment(FileMetadata attachment) {
        this.attachment = attachment;
    }

    public boolean isEdited() {
        return edited;
    }

    public void setEdited(boolean edited) {
        this.edited = edited;
    }

    public LocalDateTime getEditTimestamp() {
        return editTimestamp;
    }

    public void setEditTimestamp(LocalDateTime editTimestamp) {
        this.editTimestamp = editTimestamp;
    }

    public boolean hasAttachment() {
        return attachment != null;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ChatMessage that = (ChatMessage) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        String c = content;
        String shortContent = c == null ? "" : (c.length() > 20 ? c.substring(0, 20) + "..." : c);
        return "ChatMessage{" +
                "id=" + id +
                ", content='" + shortContent + '\'' +
                ", sender=" + (sender != null ? sender.getUsername() : "null") +
                ", timestamp=" + timestamp +
                '}';
    }
}