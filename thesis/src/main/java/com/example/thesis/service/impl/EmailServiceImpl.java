package com.example.thesis.service.impl;

import com.example.thesis.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Date;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${spring.mail.from:${spring.mail.username}}")
    private String fromAddress;

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    public EmailServiceImpl(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    @Override
    @Async
    public void sendActivationEmail(String to, String activationCode) {
        String activationLink = baseUrl + "/api/auth/activate/" + activationCode;

        Context context = new Context();
        context.setVariable("activationLink", activationLink);
        context.setVariable("userEmail", to);
        context.setVariable("currentYear", java.time.Year.now().getValue());

        String subject = "Активация аккаунта - Thesis Cloud Storage";
        String htmlContent = templateEngine.process("activation-email", context);

        sendEmail(to, subject, htmlContent, "activation");
    }

    @Override
    @Async
    public void sendPasswordResetEmail(String to, String resetToken) {
        String resetLink = baseUrl + "/api/auth/reset-password?token=" + resetToken;

        Context context = new Context();
        context.setVariable("resetLink", resetLink);
        context.setVariable("userEmail", to);
        context.setVariable("currentYear", java.time.Year.now().getValue());

        String subject = "Сброс пароля - Thesis Cloud Storage";
        String htmlContent = templateEngine.process("password-reset-email", context);

        sendEmail(to, subject, htmlContent, "password-reset");
    }

    @Override
    @Async
    public void sendGroupInvitationEmail(String to, String groupName, String inviterName, String inviteToken) {
        String inviteLink = baseUrl + "/api/group/join/" + inviteToken;

        Context context = new Context();
        context.setVariable("groupName", groupName);
        context.setVariable("inviterName", inviterName);
        context.setVariable("inviteLink", inviteLink);
        context.setVariable("userEmail", to);
        context.setVariable("currentYear", java.time.Year.now().getValue());

        String subject = "Приглашение в группу '" + groupName + "'";
        String htmlContent = templateEngine.process("group-invitation-email", context);

        sendEmail(to, subject, htmlContent, "group-invitation");
    }

    private void sendEmail(String to, String subject, String htmlContent, String emailType) {
        long startTime = System.currentTimeMillis();

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Устанавливаем отправителя
            helper.setFrom(fromAddress, "Thesis Cloud Storage");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            helper.setSentDate(new Date());

            // Добавляем headers для лучшей доставляемости
            message.addHeader("X-Mailer", "ThesisApp");
            message.addHeader("Precedence", "bulk");

            mailSender.send(message);

            long endTime = System.currentTimeMillis();
            logger.info("✅ Email sent successfully: type={}, to={}, time={}ms",
                    emailType, to, (endTime - startTime));

        } catch (MailException e) {
            logger.error("❌ Failed to send email: type={}, to={}, error={}",
                    emailType, to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email to " + to, e);
        } catch (MessagingException e) {
            logger.error("❌ Messaging error: type={}, to={}, error={}",
                    emailType, to, e.getMessage(), e);
            throw new RuntimeException("Failed to create email message", e);
        } catch (Exception e) {
            logger.error("❌ Unexpected error sending email: type={}, to={}, error={}",
                    emailType, to, e.getMessage(), e);
            throw new RuntimeException("Unexpected error sending email", e);
        }
    }


}