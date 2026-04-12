package com.example.thesis.controller;

import com.example.thesis.dto.UserUpdateRequest;
import com.example.thesis.models.User;
import com.example.thesis.security.SecurityUtils;
import com.example.thesis.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    private final UserService userService;
    private final SecurityUtils securityUtils;

    public UserController(UserService userService, SecurityUtils securityUtils) {
        this.userService = userService;
        this.securityUtils = securityUtils;
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<User> getCurrentUserProfile() {
        User currentUser = securityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.notFound().build();
        }
        
        User fresh = userService.getUserById(currentUser.getId());
        return ResponseEntity.ok(fresh);
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<User>> searchUsers(@RequestParam String query,
                                                  @RequestParam(required = false) UUID excludeGroupId) {
        List<User> users = userService.searchUsers(query, excludeGroupId);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/check-email")
    public ResponseEntity<Boolean> checkEmailAvailability(@RequestParam String email) {
        boolean available = userService.isEmailAvailable(email);
        return ResponseEntity.ok(available);
    }

    @GetMapping("/check-username")
    public ResponseEntity<Boolean> checkUsernameAvailability(@RequestParam String username) {
        boolean available = userService.isUsernameAvailable(username);
        return ResponseEntity.ok(available);
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<User> updateCurrentUser(@Valid @RequestBody UserUpdateRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.notFound().build();
        }

        User updatedUser = userService.updateUser(currentUser.getId(), request);
        return ResponseEntity.ok(updatedUser);
    }

    @PostMapping(value = "/profile/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<User> uploadAvatar(@RequestParam("file") MultipartFile file) {
        User currentUser = securityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.notFound().build();
        }
        User updated = userService.uploadAvatar(currentUser.getId(), file);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/profile/avatar")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<User> deleteAvatar() {
        User currentUser = securityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.notFound().build();
        }
        userService.deleteAvatar(currentUser.getId());
        User fresh = userService.getUserById(currentUser.getId());
        return ResponseEntity.ok(fresh);
    }

    @GetMapping("/avatar/{userId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> getAvatar(@PathVariable UUID userId) {
        byte[] data = userService.readAvatarBytes(userId);
        if (data == null || data.length == 0) {
            return ResponseEntity.notFound().build();
        }
        String mime = userService.getAvatarMimeType(userId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600")
                .contentType(MediaType.parseMediaType(mime))
                .body(data);
    }

    @PostMapping("/change-password")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> changePassword(@RequestParam String oldPassword,
                                            @RequestParam String newPassword) {
        User currentUser = securityUtils.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            userService.changePassword(currentUser.getId(), oldPassword, newPassword);
            return ResponseEntity.ok(new AuthController.MessageResponse("Password changed successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .badRequest()
                    .body(new AuthController.ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityUtils.isCurrentUser(#id)")
    public ResponseEntity<User> getUserById(@PathVariable UUID id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateUser(@PathVariable UUID id,
                                           @Valid @RequestBody UserUpdateRequest request) {
        User updatedUser = userService.updateUser(id, request);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityUtils.isCurrentUser(#id)")
    public ResponseEntity<?> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }
}
