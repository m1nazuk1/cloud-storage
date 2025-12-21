package com.example.thesis.security;

import io.jsonwebtoken.io.Encoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.crypto.SecretKey;

@Configuration
@Profile("dev") // Генерирует ключ только в dev окружении
public class JwtSecretGenerator {

    @Bean
    public CommandLineRunner generateSecretKey() {
        return args -> {
            // Самый простой способ - сгенерировать случайный ключ
            String base64Key = java.util.Base64.getEncoder()
                    .encodeToString(java.util.UUID.randomUUID().toString().getBytes());

            System.out.println("\n" + "=".repeat(60));
            System.out.println("Generated JWT Secret Key:");
            System.out.println("app.jwt.secret=" + base64Key);
            System.out.println("Add this to your application.properties file");
            System.out.println("=".repeat(60) + "\n");
        };
    }
}