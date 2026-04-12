package com.example.thesis.dto;

public class GroupMembershipPrefsRequest {

    private Boolean notificationsMuted;
    private Boolean pinned;
    
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
