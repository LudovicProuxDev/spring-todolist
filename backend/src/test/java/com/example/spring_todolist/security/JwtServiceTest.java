package com.example.spring_todolist.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Base64;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    // Cle de test generee aleatoirement, independante de celle d'application.properties.
    private static final String SECRET = Base64.getEncoder().encodeToString(
            "test-secret-key-at-least-32-bytes-long!!".getBytes());

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, 60_000L);
    }

    @Test
    void generateToken_thenExtractUsername_shouldRoundTrip() {
        String token = jwtService.generateToken("jdupont", List.of("ROLE_USER"));

        assertThat(jwtService.extractUsername(token)).isEqualTo("jdupont");
    }

    @Test
    void generateToken_thenExtractRoles_shouldRoundTrip() {
        String token = jwtService.generateToken("jdupont", List.of("ROLE_USER", "ROLE_ADMIN"));

        assertThat(jwtService.extractRoles(token)).containsExactly("ROLE_USER", "ROLE_ADMIN");
    }

    @Test
    void isValid_withFreshlyGeneratedToken_shouldReturnTrue() {
        String token = jwtService.generateToken("jdupont", List.of("ROLE_USER"));

        assertThat(jwtService.isValid(token)).isTrue();
    }

    @Test
    void isValid_withTamperedToken_shouldReturnFalse() {
        String token = jwtService.generateToken("jdupont", List.of("ROLE_USER"));

        assertThat(jwtService.isValid(token + "tamper")).isFalse();
    }

    @Test
    void isValid_withGarbageToken_shouldReturnFalse() {
        assertThat(jwtService.isValid("pas-un-jwt")).isFalse();
    }

    @Test
    void isValid_withExpiredToken_shouldReturnFalse() {
        JwtService shortLived = new JwtService(SECRET, -1_000L);
        String token = shortLived.generateToken("jdupont", List.of("ROLE_USER"));

        assertThat(shortLived.isValid(token)).isFalse();
    }
}
