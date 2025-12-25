package com.example.thesis.controller;

import com.example.thesis.dto.LoginRequest;
import com.example.thesis.dto.RegisterRequest;
import com.example.thesis.dto.AuthResponse;
import com.example.thesis.repository.UserRepository;
import com.example.thesis.security.JwtTokenProvider;
import com.example.thesis.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    @Autowired
    private JavaMailSender mailSender;

    public AuthController(AuthService authService,
                          AuthenticationManager authenticationManager,
                          JwtTokenProvider tokenProvider, UserRepository userRepository) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            AuthResponse response = authService.register(registerRequest);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity
                    .badRequest()
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/test-smtp")
    public ResponseEntity<?> testSmtpConnection() {
        try {
            System.out.println("\n=== TESTING SMTP CONNECTION ===");
            System.out.println("Host: sandbox.smtp.mailtrap.io");
            System.out.println("Port: 2525");
            System.out.println("Username: 9a2f908307f8d0");

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("no-reply@thesis-app.com");
            message.setTo("test@example.com");
            message.setSubject("SMTP Test from Thesis");
            message.setText("Test email sent at: " + new java.util.Date());

            mailSender.send(message);

            return ResponseEntity.ok("SMTP connection successful! Check Mailtrap.");
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("SMTP connection failed:\n" +
                            "Error: " + e.getMessage() + "\n" +
                            "Cause: " + (e.getCause() != null ? e.getCause().getMessage() : "none"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            AuthResponse response = authService.login(loginRequest);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/activate/{code}")
    public ResponseEntity<?> activateAccount(@PathVariable String code, HttpServletResponse response) {
        try {
            authService.activateAccount(code);

            // Перенаправляем на фронтенд с параметром успеха
            String frontendUrl = "http://localhost:3000/activation-success";
            response.sendRedirect(frontendUrl);
            return null; // Возвращаем null так как redirect уже обработан

        } catch (RuntimeException e) {
            // Для ошибок также перенаправляем на фронтенд с параметром ошибки
            try {
                String frontendUrl = "http://localhost:3000/activate?error=" +
                        URLEncoder.encode(e.getMessage(), "UTF-8");
                response.sendRedirect(frontendUrl);
                return null;
            } catch (IOException ex) {
                return ResponseEntity
                        .badRequest()
                        .body(new ErrorResponse("Activation failed: " + e.getMessage()));
            }
        } catch (IOException e) {
            return ResponseEntity
                    .badRequest()
                    .body(new ErrorResponse("Redirect failed: " + e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestHeader("Authorization") String refreshToken) {
        try {
            if (refreshToken != null && refreshToken.startsWith("Bearer ")) {
                String token = refreshToken.substring(7);
                // Здесь нужно реализовать логику refresh токена
                // Для простоты пока возвращаем успех
                return ResponseEntity.ok(new MessageResponse("Token refreshed"));
            }
            return ResponseEntity.badRequest().body(new ErrorResponse("Invalid refresh token"));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(new MessageResponse("Logged out successfully"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        try {
            authService.requestPasswordReset(email);
            return ResponseEntity.ok(new MessageResponse("Password reset instructions sent to email"));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .badRequest()
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestParam String token,
                                           @RequestParam String newPassword) {
        try {
            authService.resetPassword(token, newPassword);
            return ResponseEntity.ok(new MessageResponse("Password reset successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .badRequest()
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/reset-password")
    public ResponseEntity<?> handleResetPasswordRedirect(@RequestParam String token,
                                                         HttpServletResponse response) {
        try {
            // Проверяем валидность токена
            // Логика проверки токена (можно вынести в сервис)
            // Для простоты просто проверяем наличие пользователя с таким токеном
            if (userRepository.findByActivationCode(token).isEmpty()) {
                String frontendUrl = "http://localhost:3000/reset-password?error=" +
                        URLEncoder.encode("Invalid or expired reset token", "UTF-8");
                response.sendRedirect(frontendUrl);
                return null;
            }

            // Если токен валиден, редиректим на фронтенд с токеном
            String frontendUrl = "http://localhost:3000/reset-password?token=" +
                    URLEncoder.encode(token, "UTF-8");
            response.sendRedirect(frontendUrl);
            return null;

        } catch (IOException e) {
            return ResponseEntity
                    .badRequest()
                    .body(new ErrorResponse("Redirect failed: " + e.getMessage()));
        }
    }

    // Вспомогательные классы для ответов
    static class ErrorResponse {
        private String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    static class MessageResponse {
        private String message;

        public MessageResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}