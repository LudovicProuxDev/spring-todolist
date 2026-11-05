package com.example.spring_todolist.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import com.example.spring_todolist.dto.UserCreateRequest;
import com.example.spring_todolist.dto.UserResponse;
import com.example.spring_todolist.dto.UserUpdateRequest;
import com.example.spring_todolist.entity.Role;
import com.example.spring_todolist.entity.User;

import org.junit.jupiter.api.Test;

class UserMapperTest {

    private final UserMapper mapper = new UserMapper();

    @Test
    void toEntity_shouldSetPlainPasswordOnly_neverThePersistedPasswordField() {
        UserCreateRequest request = new UserCreateRequest(
                "jdupont", "secret123", "Jean", "Dupont", "jean.dupont@example.com");

        User user = mapper.toEntity(request);

        assertThat(user.getUsername()).isEqualTo("jdupont");
        assertThat(user.getFirstname()).isEqualTo("Jean");
        assertThat(user.getLastname()).isEqualTo("Dupont");
        assertThat(user.getEmail()).isEqualTo("jean.dupont@example.com");
        assertThat(user.getPlainPassword()).isEqualTo("secret123");
        // Le hachage est la responsabilite du service : le mapper ne doit jamais
        // ecrire le mot de passe en clair dans le champ persiste.
        assertThat(user.getPassword()).isNull();
    }

    @Test
    void toEntity_shouldNotAssignAnyRole() {
        UserCreateRequest request = new UserCreateRequest(
                "jdupont", "secret123", "Jean", "Dupont", "jean.dupont@example.com");

        User user = mapper.toEntity(request);

        // L'attribution du role par defaut est la responsabilite du service, pas du mapper.
        assertThat(user.getRoles()).isEmpty();
    }

    @Test
    void updateEntity_withOnlyEmailProvided_shouldLeaveOtherFieldsUnchanged() {
        User existing = User.builder()
                .id(1)
                .username("jdupont")
                .firstname("Jean")
                .lastname("Dupont")
                .email("ancien@example.com")
                .password("hashed")
                .roles(List.of(Role.ROLE_USER))
                .build();
        UserUpdateRequest request = new UserUpdateRequest(null, null, "nouveau@example.com", null, null);

        mapper.updateEntity(request, existing);

        assertThat(existing.getEmail()).isEqualTo("nouveau@example.com");
        assertThat(existing.getFirstname()).isEqualTo("Jean");
        assertThat(existing.getLastname()).isEqualTo("Dupont");
        assertThat(existing.getRoles()).containsExactly(Role.ROLE_USER);
        assertThat(existing.getPlainPassword()).isNull();
    }

    @Test
    void updateEntity_withPassword_shouldSetPlainPasswordNotThePersistedPasswordField() {
        User existing = User.builder().id(1).username("jdupont").password("ancien-hash").build();
        UserUpdateRequest request = new UserUpdateRequest(null, null, null, "nouveauSecret1", null);

        mapper.updateEntity(request, existing);

        assertThat(existing.getPlainPassword()).isEqualTo("nouveauSecret1");
        // Le hachage du nouveau mot de passe est la responsabilite du service.
        assertThat(existing.getPassword()).isEqualTo("ancien-hash");
    }

    @Test
    void updateEntity_withRoles_shouldReplaceRoles() {
        User existing = User.builder().id(1).username("jdupont").roles(List.of(Role.ROLE_USER)).build();
        UserUpdateRequest request = new UserUpdateRequest(null, null, null, null, List.of(Role.ROLE_USER, Role.ROLE_ADMIN));

        mapper.updateEntity(request, existing);

        assertThat(existing.getRoles()).containsExactlyInAnyOrder(Role.ROLE_USER, Role.ROLE_ADMIN);
    }

    @Test
    void toResponse_shouldMapNonSensitiveFieldsOnly() {
        User user = User.builder()
                .id(1)
                .username("jdupont")
                .firstname("Jean")
                .lastname("Dupont")
                .email("jean.dupont@example.com")
                .password("hashed")
                .roles(List.of(Role.ROLE_USER))
                .build();

        UserResponse response = mapper.toResponse(user);

        assertThat(response).isEqualTo(new UserResponse(
                1, "jdupont", "Jean", "Dupont", "jean.dupont@example.com", List.of(Role.ROLE_USER)));
    }

    @Test
    void toResponseList_shouldMapEachElement() {
        List<User> users = List.of(
                User.builder().id(1).username("jdupont").build(),
                User.builder().id(2).username("mmartin").build());

        List<UserResponse> responses = mapper.toResponseList(users);

        assertThat(responses)
                .extracting(UserResponse::username)
                .containsExactly("jdupont", "mmartin");
    }
}
