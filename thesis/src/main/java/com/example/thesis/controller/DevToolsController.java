package com.example.thesis.controller;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Вспомогательные эндпоинты для отладки SMTP. Выключаются по умолчанию ({@code app.dev-tools-enabled=false}).
 */
@RestController
@RequestMapping("/api/dev")
@ConditionalOnProperty(name = "app.dev-tools-enabled", havingValue = "true")
public class DevToolsController {

    private final JavaMailSender mailSender;

    public DevToolsController(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @PostMapping("/email")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<String> testEmail() {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("no-reply@thesis-app.com");
            message.setTo("test@example.com");
            message.setSubject("SMTP Test from Thesis App");
            message.setText("If you see this, SMTP is working correctly!");
            mailSender.send(message);
            return ResponseEntity.ok("Test email sent. Check the inbox (or Mailtrap).");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Failed: " + e.getMessage());
        }
    }

    @PostMapping("/smtp")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<String> testSmtpConnection() {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("no-reply@thesis-app.com");
            message.setTo("test@example.com");
            message.setSubject("SMTP Test from Thesis");
            message.setText("Test email sent at: " + new java.util.Date());
            mailSender.send(message);
            return ResponseEntity.ok("SMTP OK: message accepted by server.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("SMTP failed: " + e.getMessage());
        }
    }
}
