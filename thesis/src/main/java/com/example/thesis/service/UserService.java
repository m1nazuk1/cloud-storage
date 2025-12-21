package com.example.thesis.service;

import com.example.thesis.models.User;
import com.example.thesis.dto.UserUpdateRequest;
import java.util.List;
import java.util.UUID;

public interface UserService {
    User getUserById(UUID id);
    User getUserByEmail(String email);
    User getUserByUsername(String username);
    User updateUser(UUID userId, UserUpdateRequest request);
    void deleteUser(UUID userId);
    List<User> searchUsers(String searchTerm);
    void changePassword(UUID userId, String oldPassword, String newPassword);
    boolean isEmailAvailable(String email);
    boolean isUsernameAvailable(String username);
}