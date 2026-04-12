package com.example.thesis.service.impl;

import com.example.thesis.models.enums.Role;
import com.example.thesis.service.UserService;
import com.example.thesis.models.User;
import com.example.thesis.repository.UserRepository;
import com.example.thesis.repository.MembershipRepository;
import com.example.thesis.dto.UserUpdateRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Service
public class UserServiceImpl implements UserService {

    private static final long MAX_AVATAR_BYTES = 5 * 1024 * 1024;

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MembershipRepository membershipRepository;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           MembershipRepository membershipRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.membershipRepository = membershipRepository;
    }

    @Override
    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    @Override
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    @Override
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
    }

    @Override
    @Transactional
    public User updateUser(UUID userId, UserUpdateRequest request) {
        System.out.println("[USER] Updating user: " + userId);

        // ПЕРЕЗАГРУЖАЕМ пользователя из базы
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // СОХРАНЯЕМ ВСЕ КРИТИЧНЫЕ ПОЛЯ
        boolean originalEnabled = user.isEnabled();
        String originalActivationCode = user.getActivationCode();
        String originalPassword = user.getPassword();
        Set<Role> originalRoles = new HashSet<>(user.getRoles());

        System.out.println("[USER] Original state - enabled: " + originalEnabled +
                ", activationCode: " + (originalActivationCode != null ? "exists" : "null"));

        // Обновляем только разрешенные поля
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }

        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }

        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (isUsernameAvailable(request.getUsername())) {
                user.setUsername(request.getUsername());
            } else {
                throw new RuntimeException("Username is already taken");
            }
        }

        // ВОССТАНАВЛИВАЕМ КРИТИЧНЫЕ ПОЛЯ
        user.setEnabled(originalEnabled);
        user.setActivationCode(originalActivationCode);
        user.setPassword(originalPassword);
        user.setRoles(originalRoles);

        User savedUser = userRepository.save(user);

        System.out.println("[USER] User updated: " + savedUser.getUsername() +
                ", enabled: " + savedUser.isEnabled() +
                ", activation: " + (savedUser.getActivationCode() != null ? "code exists" : "no code"));

        return savedUser;
    }

    @Override
    @Transactional
    public void deleteUser(UUID userId) {
        User user = getUserById(userId);
        userRepository.delete(user);
    }

    @Override
    public List<User> searchUsers(String searchTerm) {
        return searchUsers(searchTerm, null);
    }

    @Override
    public List<User> searchUsers(String searchTerm, UUID excludeGroupId) {
        if (searchTerm == null || searchTerm.trim().length() < 2) {
            return List.of();
        }
        List<User> users = userRepository.searchUsers(searchTerm.trim());
        if (excludeGroupId == null) {
            return users;
        }
        Set<UUID> inGroup = new HashSet<>(membershipRepository.findUserIdsByGroupId(excludeGroupId));
        return users.stream().filter(u -> !inGroup.contains(u.getId())).toList();
    }

    @Override
    @Transactional
    public void changePassword(UUID userId, String oldPassword, String newPassword) {
        System.out.println("[USER] Changing password for user: " + userId);

        User user = getUserById(userId);

        // СОХРАНЯЕМ исходные значения активации
        boolean originalEnabled = user.isEnabled();
        String originalActivationCode = user.getActivationCode();

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));

        // ВАЖНО: Восстанавливаем исходные значения активации
        user.setEnabled(originalEnabled);
        user.setActivationCode(originalActivationCode); // Код активации не меняется

        userRepository.save(user);
        System.out.println("[USER] Password changed successfully for user: " + user.getUsername());
    }

    @Override
    public boolean isEmailAvailable(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        return !userRepository.existsByEmail(normalized);
    }

    @Override
    public boolean isUsernameAvailable(String username) {
        if (username == null || username.isBlank()) {
            return false;
        }
        return !userRepository.existsByUsername(username.trim());
    }

    @Override
    @Transactional
    public User uploadAvatar(UUID userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Файл не выбран");
        }
        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new RuntimeException("Изображение не больше 5 МБ");
        }
        String mime = file.getContentType() != null ? file.getContentType() : "";
        if (!mime.startsWith("image/")) {
            throw new RuntimeException("Нужно изображение (JPEG, PNG, WebP, GIF)");
        }

        User user = getUserById(userId);
        String originalFilename = StringUtils.cleanPath(Objects.requireNonNullElse(file.getOriginalFilename(), "avatar"));
        String ext = getFileExtension(originalFilename);
        if (ext.isEmpty()) {
            ext = switch (mime) {
                case "image/png" -> "png";
                case "image/webp" -> "webp";
                case "image/gif" -> "gif";
                default -> "jpg";
            };
        }

        Path dir = Paths.get(uploadDir, "avatars", userId.toString());
        try {
            Files.createDirectories(dir);
            String old = user.getAvatarStoredName();
            if (old != null && !old.isBlank()) {
                Files.deleteIfExists(dir.resolve(old));
            }
            String stored = UUID.randomUUID().toString() + "." + ext;
            Path target = dir.resolve(stored);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            user.setAvatarStoredName(stored);
            return userRepository.save(user);
        } catch (IOException e) {
            throw new RuntimeException("Не удалось сохранить аватар: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public void deleteAvatar(UUID userId) {
        User user = getUserById(userId);
        String old = user.getAvatarStoredName();
        if (old != null && !old.isBlank()) {
            try {
                Files.deleteIfExists(Paths.get(uploadDir, "avatars", userId.toString(), old));
            } catch (IOException ignored) {
                /* ignore */
            }
        }
        user.setAvatarStoredName(null);
        userRepository.save(user);
    }

    @Override
    public byte[] readAvatarBytes(UUID userId) {
        User user = getUserById(userId);
        String name = user.getAvatarStoredName();
        if (name == null || name.isBlank()) {
            return null;
        }
        Path path = Paths.get(uploadDir, "avatars", userId.toString(), name);
        if (!Files.isRegularFile(path)) {
            return null;
        }
        try {
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new RuntimeException("Не удалось прочитать аватар", e);
        }
    }

    @Override
    public String getAvatarMimeType(UUID userId) {
        User user = getUserById(userId);
        String name = user.getAvatarStoredName();
        if (name == null || name.isBlank()) {
            return "application/octet-stream";
        }
        Path path = Paths.get(uploadDir, "avatars", userId.toString(), name);
        try {
            String probed = Files.probeContentType(path);
            if (probed != null && !probed.isBlank()) {
                return probed;
            }
        } catch (IOException ignored) {
            /* fall through */
        }
        String ext = getFileExtension(name).toLowerCase(Locale.ROOT);
        return switch (ext) {
            case "png" -> "image/png";
            case "webp" -> "image/webp";
            case "gif" -> "image/gif";
            case "jpg", "jpeg" -> "image/jpeg";
            default -> "application/octet-stream";
        };
    }

    private static String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}