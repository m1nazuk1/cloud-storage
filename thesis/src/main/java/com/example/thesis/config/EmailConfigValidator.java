package com.example.thesis.config;

import com.example.thesis.service.impl.EmailServiceImpl;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class EmailConfigValidator {

    private static final Logger logger = LoggerFactory.getLogger(EmailConfigValidator.class);

    private final EmailServiceImpl emailService;

    @Value("${spring.mail.username}")
    private String mailUsername;

    public EmailConfigValidator(EmailServiceImpl emailService) {
        this.emailService = emailService;
    }

    @PostConstruct
    public void validateEmailConfig() {
        logger.info("=== Validating Email Configuration ===");
        logger.info("Mail Username: {}", mailUsername);

        if (mailUsername == null || mailUsername.isEmpty()) {
            logger.warn("⚠️  Email username is not configured!");
        } else if (mailUsername.contains("mailtrap") || mailUsername.contains("example")) {
            logger.warn("⚠️  Using test email configuration. Switch to real email for production.");
        } else {
            logger.info("✅ Using real email configuration: {}", mailUsername);
        }


        logger.info("=====================================");
    }
}