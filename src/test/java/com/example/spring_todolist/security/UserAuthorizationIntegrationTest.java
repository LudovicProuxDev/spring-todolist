package com.example.spring_todolist.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.UUID;

import com.example.spring_todolist.dto.ApiError;
import com.example.spring_todolist.dto.AuthResponse;
import com.example.spring_todolist.dto.LoginRequest;
import com.example.spring_todolist.dto.UserCreateRequest;
import com.example.spring_todolist.dto.UserResponse;
import com.example.spring_todolist.dto.UserUpdateRequest;
import com.example.spring_todolist.entity.User;
import com.example.spring_todolist.repository.UserRepository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Reproduit automatiquement le scenario verifie manuellement au curl lors
 * du developpement : "admin ou soi-meme" (@PreAuthorize) et la garde contre
 * l'auto-attribution de role ne peuvent etre prouves que via un vrai
 * contexte Spring (proxy AOP de la securite de methode), pas en MockMvc
 * standalone.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate
class UserAuthorizationIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String uniqueSuffix() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    private String registerAndLogin(String username) {
        restTemplate.postForEntity("/api/auth/register", new UserCreateRequest(
                username, "secret123", "Jean", "Dupont", username + "@example.com"), UserResponse.class);
        ResponseEntity<AuthResponse> login = restTemplate.postForEntity(
                "/api/auth/login", new LoginRequest(username, "secret123"), AuthResponse.class);
        return login.getBody().token();
    }

    /** Admin cree directement via le repository : pas de chemin API pour ca (c'est volontaire, voir note de session). */
    private String createAdminAndLogin(String username) {
        User admin = User.builder()
                .username(username)
                .password(passwordEncoder.encode("secret123"))
                .roles(List.of("ROLE_USER", "ROLE_ADMIN"))
                .build();
        userRepository.save(admin);
        ResponseEntity<AuthResponse> login = restTemplate.postForEntity(
                "/api/auth/login", new LoginRequest(username, "secret123"), AuthResponse.class);
        return login.getBody().token();
    }

    private HttpHeaders authHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }

    private Integer currentUserId(String token) {
        ResponseEntity<UserResponse> me = restTemplate.exchange(
                "/api/users/me", HttpMethod.GET, new HttpEntity<>(authHeaders(token)), UserResponse.class);
        return me.getBody().id();
    }

    @Test
    void user_canReadAndUpdateOwnProfile() {
        String token = registerAndLogin("self-" + uniqueSuffix());
        Integer id = currentUserId(token);

        ResponseEntity<UserResponse> getResponse = restTemplate.exchange(
                "/api/users/" + id, HttpMethod.GET, new HttpEntity<>(authHeaders(token)), UserResponse.class);
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<UserResponse> putResponse = restTemplate.exchange(
                "/api/users/" + id, HttpMethod.PUT,
                new HttpEntity<>(new UserUpdateRequest("Christine", null, null, null, null), authHeaders(token)),
                UserResponse.class);
        assertThat(putResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(putResponse.getBody().firstname()).isEqualTo("Christine");
    }

    @Test
    void user_cannotReadOrUpdateAnotherUsersProfile() {
        String tokenA = registerAndLogin("usera-" + uniqueSuffix());
        String tokenB = registerAndLogin("userb-" + uniqueSuffix());
        Integer idB = currentUserId(tokenB);

        ResponseEntity<ApiError> getResponse = restTemplate.exchange(
                "/api/users/" + idB, HttpMethod.GET, new HttpEntity<>(authHeaders(tokenA)), ApiError.class);
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        ResponseEntity<ApiError> putResponse = restTemplate.exchange(
                "/api/users/" + idB, HttpMethod.PUT,
                new HttpEntity<>(new UserUpdateRequest("Pirate", null, null, null, null), authHeaders(tokenA)),
                ApiError.class);
        assertThat(putResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void user_cannotListUsersOrDeleteAnyone() {
        String token = registerAndLogin("restricted-" + uniqueSuffix());
        Integer id = currentUserId(token);

        ResponseEntity<ApiError> listResponse =
                restTemplate.exchange("/api/users", HttpMethod.GET, new HttpEntity<>(authHeaders(token)), ApiError.class);
        assertThat(listResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        ResponseEntity<ApiError> deleteResponse = restTemplate.exchange(
                "/api/users/" + id, HttpMethod.DELETE, new HttpEntity<>(authHeaders(token)), ApiError.class);
        assertThat(deleteResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void user_cannotCreateUserViaUsersEndpoint() {
        String token = registerAndLogin("creator-" + uniqueSuffix());
        UserCreateRequest newUser = new UserCreateRequest(
                "created-" + uniqueSuffix(), "secret123", "Jean", "Dupont", "created-" + uniqueSuffix() + "@example.com");

        ResponseEntity<ApiError> response = restTemplate.exchange(
                "/api/users", HttpMethod.POST, new HttpEntity<>(newUser, authHeaders(token)), ApiError.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void admin_canCreateUser_whoStillOnlyGetsDefaultRole() {
        String adminToken = createAdminAndLogin("creator-admin-" + uniqueSuffix());
        String newUsername = "created-" + uniqueSuffix();
        UserCreateRequest newUser = new UserCreateRequest(
                newUsername, "secret123", "Jean", "Dupont", newUsername + "@example.com");

        ResponseEntity<UserResponse> response = restTemplate.exchange(
                "/api/users", HttpMethod.POST, new HttpEntity<>(newUser, authHeaders(adminToken)), UserResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().username()).isEqualTo(newUsername);
        // Meme cree par un admin, le compte ne recoit que le role par defaut.
        assertThat(response.getBody().roles()).containsExactly("ROLE_USER");
    }

    @Test
    void user_cannotSelfPromoteToAdminViaUpdate() {
        String token = registerAndLogin("escalation-" + uniqueSuffix());
        Integer id = currentUserId(token);

        ResponseEntity<ApiError> response = restTemplate.exchange(
                "/api/users/" + id, HttpMethod.PUT,
                new HttpEntity<>(new UserUpdateRequest(null, null, null, null, List.of("ROLE_ADMIN")), authHeaders(token)),
                ApiError.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void admin_canListReadUpdateAndDeleteAnyUser() {
        String adminToken = createAdminAndLogin("admin-" + uniqueSuffix());
        String targetToken = registerAndLogin("target-" + uniqueSuffix());
        Integer targetId = currentUserId(targetToken);

        ResponseEntity<UserResponse[]> listResponse = restTemplate.exchange(
                "/api/users", HttpMethod.GET, new HttpEntity<>(authHeaders(adminToken)), UserResponse[].class);
        assertThat(listResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<UserResponse> getResponse = restTemplate.exchange(
                "/api/users/" + targetId, HttpMethod.GET, new HttpEntity<>(authHeaders(adminToken)), UserResponse.class);
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<UserResponse> putResponse = restTemplate.exchange(
                "/api/users/" + targetId, HttpMethod.PUT,
                new HttpEntity<>(new UserUpdateRequest(null, null, null, null, List.of("ROLE_USER", "ROLE_ADMIN")), authHeaders(adminToken)),
                UserResponse.class);
        assertThat(putResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(putResponse.getBody().roles()).contains("ROLE_ADMIN");

        ResponseEntity<Void> deleteResponse = restTemplate.exchange(
                "/api/users/" + targetId, HttpMethod.DELETE, new HttpEntity<>(authHeaders(adminToken)), Void.class);
        assertThat(deleteResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }
}
