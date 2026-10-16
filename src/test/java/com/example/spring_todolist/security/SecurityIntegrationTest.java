package com.example.spring_todolist.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import com.example.spring_todolist.dto.ApiError;
import com.example.spring_todolist.dto.AuthResponse;
import com.example.spring_todolist.dto.LoginRequest;
import com.example.spring_todolist.dto.UserCreateRequest;
import com.example.spring_todolist.dto.UserResponse;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * Test d'integration bout-en-bout : verifie que SecurityConfig applique
 * reellement les regles d'autorisation (pas juste que les classes se
 * cablent), via de vraies requetes HTTP sur un contexte Spring complet.
 *
 * Ecrit dans la base de dev reelle (pas de rollback automatique possible :
 * le serveur embarque traite la requete HTTP sur un thread distinct de celui
 * du test). Chaque nom d'utilisateur/email est donc rendu unique par essai
 * pour rester rejouable sans collision.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate
class SecurityIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    private String uniqueSuffix() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    @Test
    void register_thenLogin_shouldReturnWorkingToken() {
        String username = "integration-user-" + uniqueSuffix();
        UserCreateRequest registerRequest = new UserCreateRequest(
                username, "secret123", "Jean", "Dupont", username + "@example.com");

        ResponseEntity<UserResponse> registerResponse =
                restTemplate.postForEntity("/api/auth/register", registerRequest, UserResponse.class);

        assertThat(registerResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(registerResponse.getBody()).isNotNull();
        assertThat(registerResponse.getBody().username()).isEqualTo(username);
        assertThat(registerResponse.getBody().roles()).containsExactly("ROLE_USER");

        ResponseEntity<AuthResponse> loginResponse = restTemplate.postForEntity(
                "/api/auth/login", new LoginRequest(username, "secret123"), AuthResponse.class);

        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResponse.getBody()).isNotNull();
        assertThat(loginResponse.getBody().token()).isNotBlank();
    }

    @Test
    void register_withDuplicateUsername_shouldReturnConflict() {
        String username = "duplicate-user-" + uniqueSuffix();
        UserCreateRequest request = new UserCreateRequest(
                username, "secret123", "Jean", "Dupont", username + "-1@example.com");
        restTemplate.postForEntity("/api/auth/register", request, UserResponse.class);

        UserCreateRequest sameUsername = new UserCreateRequest(
                username, "secret123", "Jean", "Dupont", username + "-2@example.com");
        ResponseEntity<ApiError> response =
                restTemplate.postForEntity("/api/auth/register", sameUsername, ApiError.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void login_withWrongPassword_shouldReturnUnauthorized() {
        String username = "wrong-password-user-" + uniqueSuffix();
        UserCreateRequest request = new UserCreateRequest(
                username, "secret123", "Jean", "Dupont", username + "@example.com");
        restTemplate.postForEntity("/api/auth/register", request, UserResponse.class);

        ResponseEntity<ApiError> response = restTemplate.postForEntity(
                "/api/auth/login", new LoginRequest(username, "mauvais"), ApiError.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void register_withInvalidPayload_shouldReturnBadRequest() {
        // password trop court (< 8 caracteres) : doit etre rejete par la validation.
        UserCreateRequest invalid = new UserCreateRequest("x", "court", null, null, "pas-un-email");

        ResponseEntity<ApiError> response = restTemplate.postForEntity("/api/auth/register", invalid, ApiError.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void protectedRoute_withoutToken_shouldReturnUnauthorized() {
        // Aucun UserController n'existe encore, mais la regle authenticated()
        // doit rejeter la requete avant meme d'atteindre Spring MVC.
        ResponseEntity<String> response = restTemplate.getForEntity("/api/users/1", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void openRoute_withoutToken_shouldReturnNotFoundRatherThanUnauthorized() {
        // /api/categories est permitAll : l'absence d'un CategoryController doit
        // se traduire par un 404 "route inconnue", pas par un 401 (ce qui
        // arriverait si le forward interne Spring Boot vers /error etait
        // lui-meme bloque par Security).
        ResponseEntity<String> response = restTemplate.getForEntity("/api/categories", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
