package com.example.spring_todolist.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.List;

import com.example.spring_todolist.dto.AuthResponse;
import com.example.spring_todolist.dto.LoginRequest;
import com.example.spring_todolist.entity.User;
import com.example.spring_todolist.exception.ResourceNotFoundException;
import com.example.spring_todolist.security.JwtService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userService, passwordEncoder, jwtService);
    }

    @Test
    void login_withValidCredentials_shouldReturnToken() {
        User user = User.builder().username("jdupont").password("hashed").roles(List.of("ROLE_USER")).build();
        when(userService.findEntityByUsername("jdupont")).thenReturn(user);
        when(passwordEncoder.matches("secret123", "hashed")).thenReturn(true);
        when(jwtService.generateToken("jdupont", List.of("ROLE_USER"))).thenReturn("un-jeton");

        AuthResponse response = authService.login(new LoginRequest("jdupont", "secret123"));

        assertThat(response).isEqualTo(new AuthResponse("un-jeton"));
    }

    @Test
    void login_withWrongPassword_shouldThrowBadCredentials() {
        User user = User.builder().username("jdupont").password("hashed").build();
        when(userService.findEntityByUsername("jdupont")).thenReturn(user);
        when(passwordEncoder.matches("mauvais", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("jdupont", "mauvais")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_withUnknownUsername_shouldThrowBadCredentials_notResourceNotFound() {
        when(userService.findEntityByUsername("inconnu"))
                .thenThrow(new ResourceNotFoundException("introuvable"));

        // Ne doit jamais laisser fuiter "utilisateur introuvable" vs "mauvais mot de
        // passe" : les deux cas renvoient la meme exception/le meme message.
        assertThatThrownBy(() -> authService.login(new LoginRequest("inconnu", "peu-importe")))
                .isInstanceOf(BadCredentialsException.class);
    }
}
