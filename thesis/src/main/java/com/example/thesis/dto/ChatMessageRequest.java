package com.example.thesis.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class ChatMessageRequest {

    @NotBlank(message = "Message content is required")
    private String content;

    @NotBlank(message = "Group ID is required")
    private UUID groupId;

    private UUID attachmentId;

    // Getters and Setters
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }

    public UUID getAttachmentId() { return attachmentId; }
    public void setAttachmentId(UUID attachmentId) { this.attachmentId = attachmentId; }
}