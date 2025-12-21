package com.example.thesis.service;

import com.example.thesis.dto.LoginRequest;
import com.example.thesis.dto.RegisterRequest;
import com.example.thesis.dto.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    void activateAccount(String activationCode);
    void requestPasswordReset(String email);
    void resetPassword(String token, String newPassword);
}