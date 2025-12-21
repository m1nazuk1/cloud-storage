package com.example.thesis.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/health")
    public Map<String, String> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Thesis Cloud Storage API");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return response;
    }

    @GetMapping("/api/public/health")
    public Map<String, String> publicHealth() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "API is running");
        return response;
    }
}