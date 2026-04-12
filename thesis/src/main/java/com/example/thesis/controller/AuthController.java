package com.example.thesis.controller;

import com.example.thesis.dto.LoginRequest;
import com.example.thesis.dto.RegisterRequest;
import com.example.thesis.dto.AuthResponse;
import com.example.thesis.models.User;
import com.example.thesis.repository.UserRepository;
import com.example.thesis.security.JwtTokenProvider;
import com.example.thesis.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
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
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public AuthController(AuthService authService,
                          AuthenticationManager authenticationManager,
                          JwtTokenProvider jwtTokenProvider,
                          UserRepository userRepository) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
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

    @PostMapping("/refresh-user")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<AuthResponse> refreshCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        // Находим пользователя по username из контекста
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Генерируем новый токен
        String jwt = jwtTokenProvider.generateToken(authentication);

        return ResponseEntity.ok(new AuthResponse(jwt, "Bearer", user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            AuthResponse response = authService.login(loginRequest);
            return ResponseEntity.ok(response);
        } catch (DisabledException e) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Подтвердите email по ссылке из письма. Проверьте папку «Спам»."));
        } catch (BadCredentialsException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Неверный логин или пароль"));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(e.getMessage() != null ? e.getMessage() : "Не удалось войти"));
        }
    }



    @GetMapping("/activate/{code}")
    public ResponseEntity<?> activateAccount(@PathVariable String code, HttpServletResponse response) {
        try {
            authService.activateAccount(code);

            String target = frontendUrl.replaceAll("/$", "") + "/login?activated=1";
            response.sendRedirect(target);
            return null; // Возвращаем null так как redirect уже обработан

        } catch (RuntimeException e) {
            // Для ошибок также перенаправляем на фронтенд с параметром ошибки
            try {
                String target = frontendUrl.replaceAll("/$", "") + "/login?activationError=" +
                        URLEncoder.encode(e.getMessage(), "UTF-8");
                response.sendRedirect(target);
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
                String target = frontendUrl.replaceAll("/$", "") + "/reset-password?error=" +
                        URLEncoder.encode("Invalid or expired reset token", "UTF-8");
                response.sendRedirect(target);
                return null;
            }

            // Если токен валиден, редиректим на фронтенд с токеном
            String target = frontendUrl.replaceAll("/$", "") + "/reset-password?token=" +
                    URLEncoder.encode(token, "UTF-8");
            response.sendRedirect(target);
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