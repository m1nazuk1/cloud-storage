package com.example.thesis.service;

import com.example.thesis.models.User;
import com.example.thesis.dto.UserUpdateRequest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface UserService {
    User getUserById(UUID id);
    User getUserByEmail(String email);
    User getUserByUsername(String username);
    User updateUser(UUID userId, UserUpdateRequest request);
    void deleteUser(UUID userId);
    List<User> searchUsers(String searchTerm);

    
    List<User> searchUsers(String searchTerm, UUID excludeGroupId);
    void changePassword(UUID userId, String oldPassword, String newPassword);
    boolean isEmailAvailable(String email);
    boolean isUsernameAvailable(String username);

    User uploadAvatar(UUID userId, MultipartFile file);

    void deleteAvatar(UUID userId);

    
    byte[] readAvatarBytes(UUID userId);

    
    String getAvatarMimeType(UUID userId);
}