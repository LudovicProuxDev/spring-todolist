package com.example.spring_todolist.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Optional;

import com.example.spring_todolist.entity.Role;
import com.example.spring_todolist.entity.User;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void findByUsername_shouldReturnMatchingUser() {
        userRepository.save(User.builder().username("jdupont").password("hashed").build());

        Optional<User> found = userRepository.findByUsername("jdupont");

        assertThat(found).isPresent();
        assertThat(found.get().getUsername()).isEqualTo("jdupont");
    }

    @Test
    void findByUsername_unknownUsername_shouldReturnEmpty() {
        Optional<User> found = userRepository.findByUsername("inconnu");

        assertThat(found).isEmpty();
    }

    @Test
    void existsByUsername_shouldReflectPersistedUsers() {
        userRepository.save(User.builder().username("jdupont").password("hashed").build());

        assertThat(userRepository.existsByUsername("jdupont")).isTrue();
        assertThat(userRepository.existsByUsername("inconnu")).isFalse();
    }

    @Test
    void existsByEmail_shouldReflectPersistedUsers() {
        userRepository.save(User.builder()
                .username("jdupont")
                .password("hashed")
                .email("jean.dupont@example.com")
                .build());

        assertThat(userRepository.existsByEmail("jean.dupont@example.com")).isTrue();
        assertThat(userRepository.existsByEmail("inconnu@example.com")).isFalse();
    }

    @Test
    void roles_shouldRoundTripThroughElementCollectionTable() {
        User saved = userRepository.save(User.builder()
                .username("jdupont")
                .password("hashed")
                .roles(List.of(Role.ROLE_USER, Role.ROLE_ADMIN))
                .build());
        entityManager.flush();
        entityManager.clear();

        User reloaded = userRepository.findById(saved.getId()).orElseThrow();

        assertThat(reloaded.getRoles()).containsExactlyInAnyOrder(Role.ROLE_USER, Role.ROLE_ADMIN);
    }
}
