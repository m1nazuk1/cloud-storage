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

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider,
                           EmailService emailService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.emailService = emailService;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Проверка уникальности email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email '" + request.getEmail() + "' is already taken");
        }

        // Проверка уникальности username
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username '" + request.getUsername() + "' is already taken");
        }

        // Создание пользователя
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
        user.setEnabled(false); // Требуется активация через email

        // Сохранение пользователя
        User savedUser = userRepository.save(user);

        // Отправка email с активацией
        try {
            emailService.sendActivationEmail(savedUser.getEmail(), activationCode);
            System.out.println("[INFO] Activation email sent to: " + savedUser.getEmail());
        } catch (Exception e) {
            // Логируем ошибку, но не прерываем регистрацию
            System.err.println("[ERROR] Failed to send activation email to " +
                    savedUser.getEmail() + ": " + e.getMessage());
            // В реальном приложении можно сохранить в лог или отправить уведомление админу
            throw new RuntimeException("Failed to send activation email. Please contact support.");
        }

        // Возвращаем ответ БЕЗ JWT токена (требуется активация аккаунта)
        Set<String> roleStrings = savedUser.getRoles().stream()
                .map(Role::name)
                .collect(Collectors.toSet());

        return new AuthResponse(
                null, // Нет токена до активации
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getUsername(),
                savedUser.getFirstName(),
                savedUser.getLastName(),
                roleStrings
        );
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
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
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Проверяем, активирован ли аккаунт
        if (!user.isEnabled()) {
            // Можно отправить повторное письмо с активацией
            if (user.getActivationCode() != null) {
                try {
                    emailService.sendActivationEmail(user.getEmail(), user.getActivationCode());
                    throw new RuntimeException("Account is not activated. We've sent a new activation email to " + user.getEmail());
                } catch (Exception e) {
                    throw new RuntimeException("Account is not activated. Please check your email or contact support.");
                }
            } else {
                throw new RuntimeException("Account is not activated. Please contact support.");
            }
        }

        // Генерация JWT токена
        String jwt = jwtTokenProvider.generateToken(authentication);

        // Генерация refresh токена (если нужно)
        // String refreshToken = jwtTokenProvider.generateRefreshToken(authentication);

        // Получаем роли для ответа
        Set<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        // Формируем ответ
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

    @Override
    @Transactional
    public void activateAccount(String activationCode) {
        // Находим пользователя по коду активации
        User user = userRepository.findByActivationCode(activationCode)
                .orElseThrow(() -> new RuntimeException("Invalid or expired activation code"));

        // Проверяем, не активирован ли уже аккаунт
        if (user.isEnabled()) {
            throw new RuntimeException("Account is already activated");
        }

        // Активируем аккаунт
        user.setEnabled(true);
        user.setActivationCode(null); // Удаляем код активации
        userRepository.save(user);

        System.out.println("[INFO] Account activated for user: " + user.getEmail());

        // Можно отправить welcome email (опционально)
        try {
            // Если хотите добавить welcome email, расширьте EmailService
            // emailService.sendWelcomeEmail(user.getEmail(), user.getUsername());
        } catch (Exception e) {
            // Игнорируем ошибку welcome email
            System.err.println("[WARN] Failed to send welcome email: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void requestPasswordReset(String email) {
        // Находим пользователя по email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        // Проверяем, активирован ли аккаунт
        if (!user.isEnabled()) {
            throw new RuntimeException("Account is not activated. Please activate your account first.");
        }

        // Генерация токена для сброса пароля
        String resetToken = UUID.randomUUID().toString();

        // Сохраняем токен (нужно создать поле в User или отдельную таблицу)
        // Для простоты пока просто сохраним в activationCode (переиспользуем поле)
        user.setActivationCode(resetToken);
        userRepository.save(user);

        // Отправляем email со ссылкой для сброса пароля
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), resetToken);
            System.out.println("[INFO] Password reset email sent to: " + user.getEmail());
        } catch (Exception e) {
            System.err.println("[ERROR] Failed to send password reset email: " + e.getMessage());
            throw new RuntimeException("Failed to send password reset email. Please try again later.");
        }
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        // Находим пользователя по токену сброса
        User user = userRepository.findByActivationCode(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        // Проверяем, активирован ли аккаунт
        if (!user.isEnabled()) {
            throw new RuntimeException("Account is not activated. Please activate your account first.");
        }

        // Устанавливаем новый пароль
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setActivationCode(null); // Удаляем токен сброса

        userRepository.save(user);

        System.out.println("[INFO] Password reset for user: " + user.getEmail());

        // Можно отправить email об успешном сбросе пароля
        try {
            // emailService.sendPasswordChangedEmail(user.getEmail());
        } catch (Exception e) {
            System.err.println("[WARN] Failed to send password changed email: " + e.getMessage());
        }
    }

    // Вспомогательный метод для повторной отправки активации
    @Transactional
    public void resendActivationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (user.isEnabled()) {
            throw new RuntimeException("Account is already activated");
        }

        // Генерируем новый код, если старый утерян
        if (user.getActivationCode() == null) {
            user.setActivationCode(UUID.randomUUID().toString());
            userRepository.save(user);
        }

        try {
            emailService.sendActivationEmail(user.getEmail(), user.getActivationCode());
            System.out.println("[INFO] Activation email resent to: " + user.getEmail());
        } catch (Exception e) {
            System.err.println("[ERROR] Failed to resend activation email: " + e.getMessage());
            throw new RuntimeException("Failed to resend activation email. Please try again later.");
        }
    }


}