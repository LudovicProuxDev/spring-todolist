package com.example.spring_todolist.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import com.example.spring_todolist.dto.AuthResponse;
import com.example.spring_todolist.dto.LoginRequest;
import com.example.spring_todolist.dto.UserCreateRequest;
import com.example.spring_todolist.dto.UserResponse;
import com.example.spring_todolist.entity.Role;
import com.example.spring_todolist.exception.DuplicateResourceException;
import com.example.spring_todolist.exception.GlobalExceptionHandler;
import com.example.spring_todolist.service.AuthService;
import com.example.spring_todolist.service.UserService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import tools.jackson.databind.ObjectMapper;

/**
 * Cablage HTTP de /api/auth (routes, codes, format ApiError). Le parcours
 * reel inscription -> connexion -> jeton est couvert par SecurityIntegrationTest.
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private AuthService authService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(userService, authService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void register_withValidPayload_shouldReturn201WithoutPassword() throws Exception {
        UserCreateRequest request = new UserCreateRequest(
                "jdupont", "secret123", "Jean", "Dupont", "jean.dupont@example.com");
        when(userService.register(request)).thenReturn(new UserResponse(
                1, "jdupont", "Jean", "Dupont", "jean.dupont@example.com", List.of(Role.ROLE_USER)));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("jdupont"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_USER"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void register_withTooShortPassword_shouldReturn400AndNotCallService() throws Exception {
        UserCreateRequest request = new UserCreateRequest(
                "jdupont", "court", null, null, "jean.dupont@example.com");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("password")));

        verify(userService, never()).register(any());
    }

    @Test
    void register_withInvalidEmail_shouldReturn400() throws Exception {
        UserCreateRequest request = new UserCreateRequest("jdupont", "secret123", null, null, "pas-un-email");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("email")));
    }

    @Test
    void register_whenUsernameTaken_shouldReturn409() throws Exception {
        UserCreateRequest request = new UserCreateRequest(
                "jdupont", "secret123", null, null, "jean.dupont@example.com");
        when(userService.register(request)).thenThrow(new DuplicateResourceException("deja pris"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("deja pris"));
    }

    @Test
    void login_withValidCredentials_shouldReturnToken() throws Exception {
        LoginRequest request = new LoginRequest("jdupont", "secret123");
        when(authService.login(request)).thenReturn(new AuthResponse("jeton.jwt.signe"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jeton.jwt.signe"));
    }

    @Test
    void login_withBadCredentials_shouldReturn401WithApiErrorShape() throws Exception {
        LoginRequest request = new LoginRequest("jdupont", "mauvais");
        when(authService.login(request)).thenThrow(new BadCredentialsException("Identifiants invalides"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Identifiants invalides"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void login_withBlankFields_shouldReturn400AndNotCallService() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("", ""))))
                .andExpect(status().isBadRequest());

        verify(authService, never()).login(any());
    }

    @Test
    void login_withMalformedJson_shouldReturn400WithGenericMessage() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\": "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("illisible")));

        verify(authService, never()).login(any());
    }
}
