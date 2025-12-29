package com.example.thesis.dto;

import com.example.thesis.models.User;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private UUID id;
    private String email;
    private String username;
    private String firstName;
    private String lastName;
    private Set<String> roles;

    // Constructors
    public AuthResponse() {}

    public AuthResponse(String token, UUID id, String email, String username,
                        String firstName, String lastName, Set<String> roles) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.roles = roles;
    }


    public AuthResponse(String token, String type, User user) {
        this.token = token;
        this.type = type;
        this.id = user.getId();
        this.email = user.getEmail();
        this.username = user.getUsername();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();

        // Конвертируем Role в String
        if (user.getRoles() != null) {
            this.roles = user.getRoles().stream()
                    .map(role -> role.name()) // или role.getName() если Role имеет поле name
                    .collect(Collectors.toSet());
        } else {
            this.roles = new HashSet<>();
        }
    }

        // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }
}