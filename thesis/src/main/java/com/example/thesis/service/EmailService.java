package com.example.thesis.service;

public interface EmailService {
    void sendActivationEmail(String to, String activationCode);
    void sendPasswordResetEmail(String to, String resetToken);
    void sendGroupInvitationEmail(String to, String groupName, String inviterName, String inviteToken);

    
    
    
    
}