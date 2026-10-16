package com.example.spring_todolist.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import com.example.spring_todolist.dto.UserCreateRequest;
import com.example.spring_todolist.dto.UserResponse;
import com.example.spring_todolist.dto.UserUpdateRequest;
import com.example.spring_todolist.exception.GlobalExceptionHandler;
import com.example.spring_todolist.exception.ResourceNotFoundException;
import com.example.spring_todolist.service.UserService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import tools.jackson.databind.ObjectMapper;

/**
 * Teste le cablage HTTP (routes, codes, JSON) et la garde "pas d'auto-
 * attribution de role" portee par le corps de la methode update(). Les
 * regles @PreAuthorize elles-memes (admin ou soi-meme) ne sont PAS
 * enforcees en MockMvc standalone (pas de proxy AOP) : elles sont
 * verifiees par le test d'integration bout-en-bout
 * (UserAuthorizationIntegrationTest), avec un vrai contexte Spring.
 */
@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    private UserController userController;
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        userController = new UserController(userService);
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private Authentication authenticationFor(String username, String... roles) {
        List<SimpleGrantedAuthority> authorities = List.of(roles).stream().map(SimpleGrantedAuthority::new).toList();
        return new TestingAuthenticationToken(username, "N/A", authorities);
    }

    @Test
    void me_shouldReturnAuthenticatedUsersProfile() throws Exception {
        when(userService.findByUsername("jdupont"))
                .thenReturn(new UserResponse(1, "jdupont", "Jean", "Dupont", "jean@example.com", List.of("ROLE_USER")));

        mockMvc.perform(get("/api/users/me").principal(authenticationFor("jdupont", "ROLE_USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("jdupont"));
    }

    @Test
    void create_shouldDelegateToServiceRegister() throws Exception {
        UserCreateRequest request = new UserCreateRequest(
                "jdupont", "secret123", "Jean", "Dupont", "jean@example.com");
        when(userService.register(request)).thenReturn(
                new UserResponse(1, "jdupont", "Jean", "Dupont", "jean@example.com", List.of("ROLE_USER")));

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("jdupont"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_USER"));
    }

    @Test
    void create_withBlankUsername_shouldReturn400() throws Exception {
        UserCreateRequest invalid = new UserCreateRequest(" ", "secret123", null, null, "jean@example.com");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void findAll_shouldDelegateToService() throws Exception {
        when(userService.findAll()).thenReturn(List.of(
                new UserResponse(1, "jdupont", null, null, null, List.of("ROLE_USER"))));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("jdupont"));
    }

    @Test
    void findById_whenMissing_shouldReturn404() throws Exception {
        when(userService.findById(99)).thenThrow(new ResourceNotFoundException("introuvable"));

        mockMvc.perform(get("/api/users/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void update_withoutRoles_shouldDelegateToServiceRegardlessOfCaller() {
        UserUpdateRequest request = new UserUpdateRequest("Jean", null, null, null, null);
        when(userService.update(eq(1), eq(request)))
                .thenReturn(new UserResponse(1, "jdupont", "Jean", null, null, List.of("ROLE_USER")));

        UserResponse response = userController.update(1, request, authenticationFor("jdupont", "ROLE_USER"));

        assertThat(response.firstname()).isEqualTo("Jean");
        verify(userService).update(1, request);
    }

    @Test
    void update_withRoles_byNonAdmin_shouldThrowAccessDenied() {
        UserUpdateRequest request = new UserUpdateRequest(null, null, null, null, List.of("ROLE_ADMIN"));

        assertThatThrownBy(() -> userController.update(1, request, authenticationFor("jdupont", "ROLE_USER")))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void update_withRoles_byAdmin_shouldDelegateToService() {
        UserUpdateRequest request = new UserUpdateRequest(null, null, null, null, List.of("ROLE_ADMIN"));
        when(userService.update(eq(1), eq(request)))
                .thenReturn(new UserResponse(1, "jdupont", null, null, null, List.of("ROLE_ADMIN")));

        UserResponse response =
                userController.update(1, request, authenticationFor("admin", "ROLE_USER", "ROLE_ADMIN"));

        assertThat(response.roles()).containsExactly("ROLE_ADMIN");
    }

    @Test
    void delete_shouldDelegateToService() {
        userController.delete(1);

        verify(userService).delete(1);
    }
}
