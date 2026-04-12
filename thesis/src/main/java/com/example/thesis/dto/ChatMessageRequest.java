package com.example.thesis.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class ChatMessageRequest {

    /** Текст или подпись к вложению; для стикера — emoji; может быть пустым, если есть вложение или стикер */
    private String content;

    @NotNull(message = "Укажите группу")
    private UUID groupId;

    private UUID attachmentId;

    /** Одна emoji или короткий код стикера из набора клиента */
    private String stickerCode;

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
}
