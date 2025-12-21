package com.example.thesis.service;

public interface EmailService {
    void sendActivationEmail(String to, String activationCode);
    void sendPasswordResetEmail(String to, String resetToken);
    void sendGroupInvitationEmail(String to, String groupName, String inviterName, String inviteToken);

    // Опциональные методы (добавьте если нужно):
    // void sendWelcomeEmail(String to, String username);
    // void sendPasswordChangedEmail(String to);
    // void sendNotificationEmail(String to, String subject, String message);
}