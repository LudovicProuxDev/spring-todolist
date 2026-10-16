package com.example.spring_todolist.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import com.example.spring_todolist.dto.UserCreateRequest;
import com.example.spring_todolist.dto.UserResponse;
import com.example.spring_todolist.dto.UserUpdateRequest;
import com.example.spring_todolist.entity.User;
import com.example.spring_todolist.exception.DuplicateResourceException;
import com.example.spring_todolist.exception.ResourceNotFoundException;
import com.example.spring_todolist.mapper.UserMapper;
import com.example.spring_todolist.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, new UserMapper(), passwordEncoder);
    }

    @Test
    void register_shouldHashPasswordAndAssignDefaultRole() {
        UserCreateRequest request = new UserCreateRequest(
                "jdupont", "secret123", "Jean", "Dupont", "jean.dupont@example.com");
        when(userRepository.existsByUsername("jdupont")).thenReturn(false);
        when(userRepository.existsByEmail("jean.dupont@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User toSave = invocation.getArgument(0);
            toSave.setId(1);
            return toSave;
        });

        UserResponse response = userService.register(request);

        assertThat(response.username()).isEqualTo("jdupont");
        assertThat(response.roles()).containsExactly("ROLE_USER");

        var savedUserCaptor = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedUserCaptor.capture());
        User saved = savedUserCaptor.getValue();
        assertThat(saved.getPassword()).isNotEqualTo("secret123");
        assertThat(passwordEncoder.matches("secret123", saved.getPassword())).isTrue();
        assertThat(saved.getPlainPassword()).isNull();
    }

    @Test
    void register_whenUsernameTaken_shouldThrowDuplicateResourceException() {
        when(userRepository.existsByUsername("jdupont")).thenReturn(true);
        UserCreateRequest request = new UserCreateRequest(
                "jdupont", "secret123", "Jean", "Dupont", "jean.dupont@example.com");

        assertThatThrownBy(() -> userService.register(request))
                .isInstanceOf(DuplicateResourceException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_whenEmailTaken_shouldThrowDuplicateResourceException() {
        when(userRepository.existsByUsername("jdupont")).thenReturn(false);
        when(userRepository.existsByEmail("jean.dupont@example.com")).thenReturn(true);
        UserCreateRequest request = new UserCreateRequest(
                "jdupont", "secret123", "Jean", "Dupont", "jean.dupont@example.com");

        assertThatThrownBy(() -> userService.register(request))
                .isInstanceOf(DuplicateResourceException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void findAll_shouldReturnMappedResponses() {
        when(userRepository.findAll()).thenReturn(List.of(User.builder().id(1).username("jdupont").build()));

        List<UserResponse> responses = userService.findAll();

        assertThat(responses).extracting(UserResponse::username).containsExactly("jdupont");
    }

    @Test
    void findById_whenMissing_shouldThrowResourceNotFoundException() {
        when(userRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findById(99)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void update_withNewPassword_shouldHashIt() {
        User existing = User.builder().id(1).username("jdupont").password("ancien-hash").build();
        when(userRepository.findById(1)).thenReturn(Optional.of(existing));
        when(userRepository.save(existing)).thenReturn(existing);
        UserUpdateRequest request = new UserUpdateRequest(null, null, null, "nouveauSecret1", null);

        userService.update(1, request);

        assertThat(existing.getPassword()).isNotEqualTo("ancien-hash");
        assertThat(passwordEncoder.matches("nouveauSecret1", existing.getPassword())).isTrue();
        assertThat(existing.getPlainPassword()).isNull();
    }

    @Test
    void update_withoutPassword_shouldKeepExistingHash() {
        User existing = User.builder().id(1).username("jdupont").password("ancien-hash").build();
        when(userRepository.findById(1)).thenReturn(Optional.of(existing));
        when(userRepository.save(existing)).thenReturn(existing);
        UserUpdateRequest request = new UserUpdateRequest("Jean", null, null, null, null);

        userService.update(1, request);

        assertThat(existing.getPassword()).isEqualTo("ancien-hash");
    }

    @Test
    void update_whenMissing_shouldThrowResourceNotFoundException() {
        when(userRepository.findById(99)).thenReturn(Optional.empty());
        UserUpdateRequest request = new UserUpdateRequest("Jean", null, null, null, null);

        assertThatThrownBy(() -> userService.update(99, request)).isInstanceOf(ResourceNotFoundException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void delete_whenExists_shouldCallRepositoryDelete() {
        when(userRepository.existsById(1)).thenReturn(true);

        userService.delete(1);

        verify(userRepository).deleteById(1);
    }

    @Test
    void delete_whenMissing_shouldThrowResourceNotFoundException() {
        when(userRepository.existsById(99)).thenReturn(false);

        assertThatThrownBy(() -> userService.delete(99)).isInstanceOf(ResourceNotFoundException.class);
        verify(userRepository, never()).deleteById(any());
    }

    @Test
    void findEntityByUsername_whenMissing_shouldThrowResourceNotFoundException() {
        when(userRepository.findByUsername("inconnu")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findEntityByUsername("inconnu"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void findEntityByUsername_whenExists_shouldReturnEntity() {
        User user = User.builder().id(1).username("jdupont").build();
        when(userRepository.findByUsername("jdupont")).thenReturn(Optional.of(user));

        User found = userService.findEntityByUsername("jdupont");

        assertThat(found).isEqualTo(user);
    }

    @Test
    void findByUsername_whenExists_shouldReturnMappedResponse() {
        User user = User.builder().id(1).username("jdupont").roles(List.of("ROLE_USER")).build();
        when(userRepository.findByUsername("jdupont")).thenReturn(Optional.of(user));

        UserResponse response = userService.findByUsername("jdupont");

        assertThat(response.username()).isEqualTo("jdupont");
    }

    @Test
    void findByUsername_whenMissing_shouldThrowResourceNotFoundException() {
        when(userRepository.findByUsername("inconnu")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findByUsername("inconnu"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
