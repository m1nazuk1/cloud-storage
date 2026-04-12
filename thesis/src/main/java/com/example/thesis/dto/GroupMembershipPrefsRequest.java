package com.example.thesis.dto;

/**
 * Личные настройки участника в группе (список групп, уведомления).
 */
public class GroupMembershipPrefsRequest {

    private Boolean notificationsMuted;
    private Boolean pinned;
    /** Hex-цвет обводки или пустая строка для сброса */
    private String accentColor;

    public Boolean getNotificationsMuted() {
        return notificationsMuted;
    }

    public void setNotificationsMuted(Boolean notificationsMuted) {
        this.notificationsMuted = notificationsMuted;
    }

    public Boolean getPinned() {
        return pinned;
    }

    public void setPinned(Boolean pinned) {
        this.pinned = pinned;
    }

    public String getAccentColor() {
        return accentColor;
    }

    public void setAccentColor(String accentColor) {
        this.accentColor = accentColor;
    }
}
