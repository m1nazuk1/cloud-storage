package com.example.thesis.service.impl;

import com.example.thesis.models.User;
import com.example.thesis.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UserActivationService {

    private final UserRepository userRepository;

    public UserActivationService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public User activateUser(String activationCode) {
        User user = userRepository.findByActivationCode(activationCode)
                .orElseThrow(() -> new RuntimeException("Invalid activation code"));

        if (user.isEnabled()) {
            return user; 
        }

        
        user.setEnabled(true);
        

        return userRepository.save(user);
    }

    @Transactional
    public User createUser(User user) {
        
        user.setEnabled(false);
        user.setActivationCode(UUID.randomUUID().toString());

        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(UUID userId, User updatedUser) {
        User existingUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        
        boolean wasEnabled = existingUser.isEnabled();
        String activationCode = existingUser.getActivationCode();

        
        existingUser.setUsername(updatedUser.getUsername());
        existingUser.setEmail(updatedUser.getEmail());
        existingUser.setFirstName(updatedUser.getFirstName());
        existingUser.setLastName(updatedUser.getLastName());

        
        existingUser.setEnabled(wasEnabled);
        existingUser.setActivationCode(activationCode);

        return userRepository.save(existingUser);
    }
}