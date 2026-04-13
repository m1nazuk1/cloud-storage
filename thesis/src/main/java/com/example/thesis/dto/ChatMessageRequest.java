package com.example.thesis.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class ChatMessageRequest {

    
    private String content;

    @NotNull(message = "Укажите группу")
    private UUID groupId;

    private UUID attachmentId;

    
    private String stickerCode;

    private java.util.UUID replyToId;

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public UUID getGroupId() {
        return groupId;
    }

    public void setGroupId(UUID groupId) {
        this.groupId = groupId;
    }

    public UUID getAttachmentId() {
        return attachmentId;
    }

    public void setAttachmentId(UUID attachmentId) {
        this.attachmentId = attachmentId;
    }

    public String getStickerCode() {
        return stickerCode;
    }

    public void setStickerCode(String stickerCode) {
        this.stickerCode = stickerCode;
    }

    public java.util.UUID getReplyToId() {
        return replyToId;
    }

    public void setReplyToId(java.util.UUID replyToId) {
        this.replyToId = replyToId;
    }
}
