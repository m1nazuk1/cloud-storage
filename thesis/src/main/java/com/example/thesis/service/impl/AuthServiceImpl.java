package com.example.thesis.service.impl;

import com.example.thesis.service.AuthService;
import com.example.thesis.service.EmailService;
import com.example.thesis.models.User;
import com.example.thesis.models.enums.Role;
import com.example.thesis.repository.UserRepository;
import com.example.thesis.dto.LoginRequest;
import com.example.thesis.dto.RegisterRequest;
import com.example.thesis.dto.AuthResponse;
import com.example.thesis.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final UserActivationService userActivationService;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider,
                           EmailService emailService,
                           UserActivationService userActivationService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.emailService = emailService;
        this.userActivationService = userActivationService;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        System.out.println("[AUTH] Registering user: " + request.getEmail() + ", username: " + request.getUsername());

        // Проверка уникальности email
        if (userRepository.existsByEmail(request.getEmail())) {
            User existingUser = userRepository.findByEmail(request.getEmail()).orElse(null);
            if (existingUser != null) {
                if (existingUser.isEnabled()) {
                    System.out.println("[AUTH] Email already exists and is enabled: " + request.getEmail());
                    throw new RuntimeException("Email '" + request.getEmail() + "' is already taken");
                } else {
                    // Пользователь существует, но не активирован - можем обновить
                    System.out.println("[AUTH] Updating existing unactivated user: " + request.getEmail());

                    // Обновляем данные
                    existingUser.setUsername(request.getUsername());
                    existingUser.setPassword(passwordEncoder.encode(request.getPassword()));
                    existingUser.setFirstName(request.getFirstName());
                    existingUser.setLastName(request.getLastName());

                    // Генерируем новый код активации
                    String newActivationCode = UUID.randomUUID().toString();
                    existingUser.setActivationCode(newActivationCode);
                    existingUser.setEnabled(false);

                    userRepository.save(existingUser);

                    // Отправляем новый код активации
                    try {
                        emailService.sendActivationEmail(existingUser.getEmail(), newActivationCode);
                        System.out.println("[AUTH] New activation email sent to existing unactivated user: " + existingUser.getEmail());
                    } catch (Exception e) {
                        System.err.println("[AUTH] Failed to send activation email: " + e.getMessage());
                    }

                    return createAuthResponse(null, existingUser);
                }
            }
        }

        // Проверка уникальности username
        if (userRepository.existsByUsername(request.getUsername())) {
            System.out.println("[AUTH] Username already taken: " + request.getUsername());
            throw new RuntimeException("Username '" + request.getUsername() + "' is already taken");
        }

        // Создание нового пользователя
        User user = new User();
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());

        // Установка ролей
        Set<Role> roles = new HashSet<>();
        roles.add(Role.ROLE_USER);
        user.setRoles(roles);

        // Генерация кода активации
        String activationCode = UUID.randomUUID().toString();
        user.setActivationCode(activationCode);
        user.setEnabled(false);

        // Сохранение пользователя
        User savedUser = userRepository.save(user);
        System.out.println("[AUTH] User saved with ID: " + savedUser.getId());

        // Отправка email с активацией
        try {
            emailService.sendActivationEmail(savedUser.getEmail(), activationCode);
            System.out.println("[AUTH] Activation email sent to: " + savedUser.getEmail());
        } catch (Exception e) {
            System.err.println("[AUTH] Failed to send activation email to " +
                    savedUser.getEmail() + ": " + e.getMessage());
            // Не выбрасываем исключение - пользователь может запросить повторную отправку
        }

        return createAuthResponse(null, savedUser);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        System.out.println("[AUTH] Login attempt: " + request.getEmailOrUsername());

        try {
            // Аутентификация пользователя
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmailOrUsername(),
                            request.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Получаем UserDetails из аутентификации
            org.springframework.security.core.userdetails.UserDetails userDetails =
                    (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal();

            // Находим нашего пользователя в БД
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .or(() -> userRepository.findByUsername(userDetails.getUsername()))
                    .orElseThrow(() -> {
                        System.out.println("[AUTH] User not found in DB: " + userDetails.getUsername());
                        return new RuntimeException("User not found");
                    });

            System.out.println("[AUTH] User found: " + user.getUsername() + ", enabled: " + user.isEnabled());

            // Проверяем, активирован ли аккаунт
            if (!user.isEnabled()) {
                System.out.println("[AUTH] Account not activated for: " + user.getEmail());

                // Пытаемся отправить повторное письмо с активацией
                if (user.getActivationCode() != null) {
                    try {
                        emailService.sendActivationEmail(user.getEmail(), user.getActivationCode());
                        throw new RuntimeException("Account is not activated. We've sent a new activation email to " + user.getEmail());
                    } catch (Exception e) {
                        throw new RuntimeException("Account is not activated. Please check your email or contact support.");
                    }
                } else {
                    // Если код активации утерян, генерируем новый
                    String newActivationCode = UUID.randomUUID().toString();
                    user.setActivationCode(newActivationCode);
                    userRepository.save(user);

                    try {
                        emailService.sendActivationEmail(user.getEmail(), newActivationCode);
                        throw new RuntimeException("Account is not activated. We've sent a new activation email to " + user.getEmail());
                    } catch (Exception e) {
                        throw new RuntimeException("Account is not activated. Please contact support for a new activation link.");
                    }
                }
            }

            // Генерация JWT токена
            String jwt = jwtTokenProvider.generateToken(authentication);
            System.out.println("[AUTH] JWT generated for user: " + user.getUsername());

            // Формируем ответ с токеном
            return createAuthResponse(jwt, user);

        } catch (Exception e) {
            System.err.println("[AUTH] Login error: " + e.getMessage());
            throw e;
        }
    }

    @Override
    @Transactional
    public void activateAccount(String activationCode) {
        System.out.println("[AUTH] Activating account with code: " + activationCode);

        // Находим пользователя по коду активации
        User user = userRepository.findByActivationCode(activationCode)
                .orElseThrow(() -> {
                    System.out.println("[AUTH] Invalid activation code: " + activationCode);
                    return new RuntimeException("Invalid or expired activation code");
                });

        // Проверяем, не активирован ли уже аккаунт
        if (user.isEnabled()) {
            System.out.println("[AUTH] Account already activated: " + user.getEmail());
            throw new RuntimeException("Account is already activated");
        }

        // ВАЖНОЕ ИСПРАВЛЕНИЕ: Активируем аккаунт НЕ удаляя код активации
        user.setEnabled(true);
        // НЕ УДАЛЯЕМ код активации: user.setActivationCode(null);

        userRepository.save(user);

        System.out.println("[AUTH] Account activated for user: " + user.getEmail());
    }

    @Override
    @Transactional
    public void requestPasswordReset(String email) {
        System.out.println("[AUTH] Password reset requested for: " + email);

        // Находим пользователя по email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    System.out.println("[AUTH] User not found for password reset: " + email);
                    return new RuntimeException("User not found with email: " + email);
                });

        // Проверяем, активирован ли аккаунт
        if (!user.isEnabled()) {
            System.out.println("[AUTH] Account not activated for password reset: " + email);
            throw new RuntimeException("Account is not activated. Please activate your account first.");
        }

        // Генерация токена для сброса пароля
        String resetToken = UUID.randomUUID().toString();

        // Создаем новый токен сброса пароля
        user.setActivationCode(resetToken);
        userRepository.save(user);

        System.out.println("[AUTH] Reset token generated for: " + email);

        // Отправляем email со ссылкой для сброса пароля
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), resetToken);
            System.out.println("[AUTH] Password reset email sent to: " + user.getEmail());
        } catch (Exception e) {
            System.err.println("[AUTH] Failed to send password reset email: " + e.getMessage());
            throw new RuntimeException("Failed to send password reset email. Please try again later.");
        }
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        System.out.println("[AUTH] Resetting password with token");

        // Находим пользователя по токену сброса
        User user = userRepository.findByActivationCode(token)
                .orElseThrow(() -> {
                    System.out.println("[AUTH] Invalid reset token");
                    return new RuntimeException("Invalid or expired reset token");
                });

        // Проверяем, активирован ли аккаунт
        if (!user.isEnabled()) {
            System.out.println("[AUTH] Account not activated during password reset: " + user.getEmail());
            throw new RuntimeException("Account is not activated. Please activate your account first.");
        }

        // Устанавливаем новый пароль
        user.setPassword(passwordEncoder.encode(newPassword));

        // После сброса пароля удаляем токен сброса
        user.setActivationCode(null);

        userRepository.save(user);

        System.out.println("[AUTH] Password reset for user: " + user.getEmail());
    }

    // Вспомогательный метод для повторной отправки активации
    @Transactional
    public void resendActivationEmail(String email) {
        System.out.println("[AUTH] Resending activation email to: " + email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    System.out.println("[AUTH] User not found for resend: " + email);
                    return new RuntimeException("User not found with email: " + email);
                });

        if (user.isEnabled()) {
            System.out.println("[AUTH] Account already activated: " + email);
            throw new RuntimeException("Account is already activated");
        }

        // Если код активации отсутствует, генерируем новый
        if (user.getActivationCode() == null) {
            String newActivationCode = UUID.randomUUID().toString();
            user.setActivationCode(newActivationCode);
            userRepository.save(user);
            System.out.println("[AUTH] New activation code generated for: " + email);
        }

        try {
            emailService.sendActivationEmail(user.getEmail(), user.getActivationCode());
            System.out.println("[AUTH] Activation email resent to: " + user.getEmail());
        } catch (Exception e) {
            System.err.println("[AUTH] Failed to resend activation email: " + e.getMessage());
            throw new RuntimeException("Failed to resend activation email. Please try again later.");
        }
    }

    // Вспомогательный метод для создания AuthResponse
    private AuthResponse createAuthResponse(String jwt, User user) {
        Set<String> roles = user.getRoles().stream()
                .map(Role::name)
                .collect(Collectors.toSet());

        return new AuthResponse(
                jwt,
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getFirstName(),
                user.getLastName(),
                roles
        );
    }
}