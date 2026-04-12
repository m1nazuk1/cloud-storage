package com.example.thesis.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtTokenProviderTest {

    private final JwtTokenProvider jwtTokenProvider = new JwtTokenProvider();

    @BeforeEach
    void setUp() {
        String secret = Base64.getEncoder().encodeToString(new byte[64]);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", secret);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationInMs", 3_600_000);
        ReflectionTestUtils.setField(jwtTokenProvider, "refreshTokenExpirationInMs", 86_400_000);
    }

    @Test
    void generateToken_validateAndReadSubject_roundTrip() {
        UserDetails principal = User.withUsername("testuser")
                .password("pw")
                .roles("USER")
                .build();
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        String token = jwtTokenProvider.generateToken(auth);
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals("testuser", jwtTokenProvider.getUsernameFromToken(token));
    }

    @Test
    void validateToken_rejectsInvalidString() {
        assertFalse(jwtTokenProvider.validateToken("not-a-valid-jwt"));
    }
}
