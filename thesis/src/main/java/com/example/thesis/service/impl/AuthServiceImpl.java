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
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
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

    private static String normalizeEmail(String email) {
        if (email == null) {
            return "";
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        String username = request.getUsername() != null ? request.getUsername().trim() : "";
        if (email.isEmpty()) {
            throw new RuntimeException("Укажите email");
        }
        if (username.isEmpty()) {
            throw new RuntimeException("Укажите имя пользователя");
        }

        System.out.println("[AUTH] Registering user: " + email + ", username: " + username);

        
        if (userRepository.existsByEmail(email)) {
            User existingUser = userRepository.findByEmail(email).orElse(null);
            if (existingUser != null) {
                if (existingUser.isEnabled()) {
                    System.out.println("[AUTH] Email already exists and is enabled: " + email);
                    throw new RuntimeException("Этот email уже зарегистрирован");
                } else {
                    
                    System.out.println("[AUTH] Updating existing unactivated user: " + email);

                    
                    existingUser.setUsername(username);
                    existingUser.setPassword(passwordEncoder.encode(request.getPassword()));
                    existingUser.setFirstName(request.getFirstName());
                    existingUser.setLastName(request.getLastName());

                    
                    String newActivationCode = UUID.randomUUID().toString();
                    existingUser.setActivationCode(newActivationCode);
                    existingUser.setEnabled(false);

                    userRepository.save(existingUser);

                    
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

        
        if (userRepository.existsByUsername(username)) {
            System.out.println("[AUTH] Username already taken: " + username);
            throw new RuntimeException("Это имя пользователя уже занято");
        }

        
        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());

        
        Set<Role> roles = new HashSet<>();
        roles.add(Role.ROLE_USER);
        user.setRoles(roles);

        
        String activationCode = UUID.randomUUID().toString();
        user.setActivationCode(activationCode);
        user.setEnabled(false);

        
        User savedUser = userRepository.save(user);
        System.out.println("[AUTH] User saved with ID: " + savedUser.getId());

        
        try {
            emailService.sendActivationEmail(savedUser.getEmail(), activationCode);
            System.out.println("[AUTH] Activation email sent to: " + savedUser.getEmail());
        } catch (Exception e) {
            System.err.println("[AUTH] Failed to send activation email to " +
                    savedUser.getEmail() + ": " + e.getMessage());
            
        }

        return createAuthResponse(null, savedUser);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String raw = request.getEmailOrUsername() != null ? request.getEmailOrUsername().trim() : "";
        String loginKey = raw.contains("@") ? raw.toLowerCase(Locale.ROOT) : raw;
        System.out.println("[AUTH] Login attempt: " + loginKey);

        try {
            
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginKey,
                            request.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            
            org.springframework.security.core.userdetails.UserDetails userDetails =
                    (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal();

            
            User user = userRepository.findByUsername(userDetails.getUsername())
                    .or(() -> userRepository.findByEmailIgnoreCase(userDetails.getUsername()))
                    .orElseThrow(() -> {
                        System.out.println("[AUTH] User not found in DB: " + userDetails.getUsername());
                        return new RuntimeException("User not found");
                    });

            System.out.println("[AUTH] User found: " + user.getUsername() + ", enabled: " + user.isEnabled());

            
            
            if (!user.isEnabled()) {
                throw new RuntimeException("Аккаунт не активирован. Подтвердите email по ссылке из письма.");
            }

            
            String jwt = jwtTokenProvider.generateToken(authentication);
            System.out.println("[AUTH] JWT generated for user: " + user.getUsername());

            
            return createAuthResponse(jwt, user);

        } catch (Exception e) {
            System.err.println("[AUTH] Login error: " + e.getMessage());
            throw e;
        }
    }

    @Transactional
    public void refreshUserInContext(String username) {
        
        User refreshedUser = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new RuntimeException("User not found"));

        
        List<GrantedAuthority> authorities = refreshedUser.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.name()))
                .collect(Collectors.toList());

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                refreshedUser.getUsername(),
                refreshedUser.getPassword(),
                refreshedUser.isEnabled(),
                true, true, true,
                authorities
        );

        Authentication newAuth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );

        SecurityContextHolder.getContext().setAuthentication(newAuth);
    }

    @Override
    @Transactional
    public void activateAccount(String activationCode) {
        System.out.println("[AUTH] Activating account with code: " + activationCode);

        
        User user = userRepository.findByActivationCode(activationCode)
                .orElseThrow(() -> {
                    System.out.println("[AUTH] Invalid activation code: " + activationCode);
                    return new RuntimeException("Invalid or expired activation code");
                });

        
        if (user.isEnabled()) {
            System.out.println("[AUTH] Account already activated: " + user.getEmail());
            throw new RuntimeException("Account is already activated");
        }

        
        user.setEnabled(true);
        

        userRepository.save(user);

        System.out.println("[AUTH] Account activated for user: " + user.getEmail());
    }

    @Override
    @Transactional
    public void requestPasswordReset(String email) {
        System.out.println("[AUTH] Password reset requested for: " + email);

        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    System.out.println("[AUTH] User not found for password reset: " + email);
                    return new RuntimeException("User not found with email: " + email);
                });

        
        if (!user.isEnabled()) {
            System.out.println("[AUTH] Account not activated for password reset: " + email);
            throw new RuntimeException("Account is not activated. Please activate your account first.");
        }

        
        String resetToken = UUID.randomUUID().toString();

        
        user.setActivationCode(resetToken);
        userRepository.save(user);

        System.out.println("[AUTH] Reset token generated for: " + email);

        
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

        
        User user = userRepository.findByActivationCode(token)
                .orElseThrow(() -> {
                    System.out.println("[AUTH] Invalid reset token");
                    return new RuntimeException("Invalid or expired reset token");
                });

        
        if (!user.isEnabled()) {
            System.out.println("[AUTH] Account not activated during password reset: " + user.getEmail());
            throw new RuntimeException("Account is not activated. Please activate your account first.");
        }

        
        user.setPassword(passwordEncoder.encode(newPassword));

        
        user.setActivationCode(null);

        userRepository.save(user);

        System.out.println("[AUTH] Password reset for user: " + user.getEmail());
    }

    
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
                roles,
                user.isEnabled()
        );
    }
}