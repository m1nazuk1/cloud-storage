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

    @Value("${spring.mail.password:}")
    private String mailPassword;

    public EmailConfigValidator(EmailServiceImpl emailService) {
        this.emailService = emailService;
    }

    @PostConstruct
    public void validateEmailConfig() {
        logger.info("=== Проверка почты (SMTP) ===");
        logger.info("Mail Username: {}", mailUsername);

        if (mailUsername == null || mailUsername.isEmpty()) {
            logger.warn("⚠️ spring.mail.username не задан — отправка писем невозможна.");
        } else if (mailUsername.contains("mailtrap") || mailUsername.contains("example")) {
            logger.warn("⚠️ Тестовая почта (mailtrap/example). Для реальных писем настройте SMTP.");
        } else {
            logger.info("✅ SMTP user: {}", mailUsername);
        }

        if (mailPassword == null || mailPassword.isBlank()) {
            logger.error("❌ spring.mail.password / MAIL_PASSWORD пустой — регистрация не сможет отправить письмо активации. Задайте пароль приложения Яндекса в переменной MAIL_PASSWORD.");
        } else {
            logger.info("✅ Пароль SMTP задан (переменная MAIL_PASSWORD)");
        }

        logger.info("===============================");
    }
}