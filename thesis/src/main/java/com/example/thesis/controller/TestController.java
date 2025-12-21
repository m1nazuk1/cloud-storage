package com.example.thesis.controller;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private final JavaMailSender mailSender;

    public TestController(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @PostMapping("/email")
    public String testEmail() {
        try {
            System.out.println("\n=== TEST EMAIL CONFIGURATION ===");
            System.out.println("Testing SMTP connection...");

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("no-reply@thesis-app.com");
            message.setTo("test@example.com");
            message.setSubject("SMTP Test from Thesis App");
            message.setText("If you see this, SMTP is working correctly!");

            mailSender.send(message);

            return "✅ Test email sent successfully! Check Mailtrap.";
        } catch (Exception e) {
            return "❌ Failed to send test email: " + e.getMessage() +
                    "\nCause: " + (e.getCause() != null ? e.getCause().getMessage() : "none");
        }
    }
}