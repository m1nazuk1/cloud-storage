package com.example.thesis.service.impl;

import com.example.thesis.models.enums.Role;
import com.example.thesis.service.UserService;
import com.example.thesis.models.User;
import com.example.thesis.repository.UserRepository;
import com.example.thesis.dto.UserUpdateRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    @Override
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    @Override
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
    }

    @Override
    @Transactional
    public User updateUser(UUID userId, UserUpdateRequest request) {
        System.out.println("[USER] Updating user: " + userId);

        // ПЕРЕЗАГРУЖАЕМ пользователя из базы
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // СОХРАНЯЕМ ВСЕ КРИТИЧНЫЕ ПОЛЯ
        boolean originalEnabled = user.isEnabled();
        String originalActivationCode = user.getActivationCode();
        String originalPassword = user.getPassword();
        Set<Role> originalRoles = new HashSet<>(user.getRoles());

        System.out.println("[USER] Original state - enabled: " + originalEnabled +
                ", activationCode: " + (originalActivationCode != null ? "exists" : "null"));

        // Обновляем только разрешенные поля
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }

        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }

        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (isUsernameAvailable(request.getUsername())) {
                user.setUsername(request.getUsername());
            } else {
                throw new RuntimeException("Username is already taken");
            }
        }

        // ВОССТАНАВЛИВАЕМ КРИТИЧНЫЕ ПОЛЯ
        user.setEnabled(originalEnabled);
        user.setActivationCode(originalActivationCode);
        user.setPassword(originalPassword);
        user.setRoles(originalRoles);

        User savedUser = userRepository.save(user);

        System.out.println("[USER] User updated: " + savedUser.getUsername() +
                ", enabled: " + savedUser.isEnabled() +
                ", activation: " + (savedUser.getActivationCode() != null ? "code exists" : "no code"));

        return savedUser;
    }

    @Override
    @Transactional
    public void deleteUser(UUID userId) {
        User user = getUserById(userId);
        userRepository.delete(user);
    }

    @Override
    public List<User> searchUsers(String searchTerm) {
        return userRepository.searchUsers(searchTerm);
    }

    @Override
    @Transactional
    public void changePassword(UUID userId, String oldPassword, String newPassword) {
        System.out.println("[USER] Changing password for user: " + userId);

        User user = getUserById(userId);

        // СОХРАНЯЕМ исходные значения активации
        boolean originalEnabled = user.isEnabled();
        String originalActivationCode = user.getActivationCode();

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));

        // ВАЖНО: Восстанавливаем исходные значения активации
        user.setEnabled(originalEnabled);
        user.setActivationCode(originalActivationCode); // Код активации не меняется

        userRepository.save(user);
        System.out.println("[USER] Password changed successfully for user: " + user.getUsername());
    }

    @Override
    public boolean isEmailAvailable(String email) {
        return !userRepository.existsByEmail(email);
    }

    @Override
    public boolean isUsernameAvailable(String username) {
        return !userRepository.existsByUsername(username);
    }
}