package com.example.thesis.security;

import com.example.thesis.models.User;
import com.example.thesis.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(CustomUserDetailsService.class);
    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        logger.info("Loading user by username or email: {}", usernameOrEmail);

        // Сначала пробуем найти по username
        User user = userRepository.findByUsername(usernameOrEmail)
                .or(() -> {
                    logger.info("User not found by username: {}, trying email", usernameOrEmail);
                    return userRepository.findByEmail(usernameOrEmail);
                })
                .orElseThrow(() -> {
                    logger.error("User not found with username or email: {}", usernameOrEmail);
                    // Проверим, существует ли пользователь в принципе
                    logger.error("All users in DB: {}", userRepository.findAll().stream()
                            .map(u -> u.getUsername() + "(" + u.getEmail() + ")")
                            .collect(Collectors.joining(", ")));
                    return new UsernameNotFoundException("User not found with username or email: " + usernameOrEmail);
                });

        logger.info("User found: {}, enabled: {}, roles: {}",
                user.getUsername(), user.isEnabled(), user.getRoles());

        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> {
                    String roleName = role.name().startsWith("ROLE_") ? role.name() : "ROLE_" + role.name();
                    logger.info("Granting authority: {}", roleName);
                    return new SimpleGrantedAuthority(roleName);
                })
                .collect(Collectors.toList());

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                authorities
        );
    }

    @Transactional
    public UserDetails loadUserById(UUID id) {
        logger.info("Loading user by ID: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));

        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> {
                    String roleName = role.name().startsWith("ROLE_") ? role.name() : "ROLE_" + role.name();
                    return new SimpleGrantedAuthority(roleName);
                })
                .collect(Collectors.toList());

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                authorities
        );
    }
}