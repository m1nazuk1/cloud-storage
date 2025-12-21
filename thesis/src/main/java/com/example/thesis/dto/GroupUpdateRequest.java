package com.example.thesis.dto;

public class GroupUpdateRequest {
    private String name;
    private String description;
    private boolean regenerateToken;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isRegenerateToken() { return regenerateToken; }
    public void setRegenerateToken(boolean regenerateToken) { this.regenerateToken = regenerateToken; }
}