package com.example.thesis.controller;

import com.example.thesis.models.User;
import com.example.thesis.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    private final SecurityUtils securityUtils;

    public DebugController(SecurityUtils securityUtils) {
        this.securityUtils = securityUtils;
    }

    @GetMapping("/user-status")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getUserStatus() {
        User user = securityUtils.getCurrentUser();

        Map<String, Object> status = new HashMap<>();
        status.put("id", user.getId());
        status.put("username", user.getUsername());
        status.put("email", user.getEmail());
        status.put("enabled", user.isEnabled());
        status.put("activationCode", user.getActivationCode());
        status.put("hasActivationCode", user.getActivationCode() != null);

        return ResponseEntity.ok(status);
    }
}