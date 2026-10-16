package com.example.spring_todolist.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Set;

import jakarta.validation.ConstraintViolation;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class UserTest {

    @Nested
    @DisplayName("Construction")
    class Construction {

        @Test
        @DisplayName("Le builder renseigne tous les champs")
        void builder_shouldPopulateAllFields() {
            User user = User.builder()
                    .id(1)
                    .username("jdupont")
                    .roles(List.of("ROLE_USER", "ROLE_ADMIN"))
                    .password("hashed-password")
                    .plainPassword("clear-password")
                    .lastname("Dupont")
                    .firstname("Jean")
                    .email("jean.dupont@example.com")
                    .build();

            assertThat(user.getId()).isEqualTo(1);
            assertThat(user.getUsername()).isEqualTo("jdupont");
            assertThat(user.getRoles()).containsExactly("ROLE_USER", "ROLE_ADMIN");
            assertThat(user.getPassword()).isEqualTo("hashed-password");
            assertThat(user.getPlainPassword()).isEqualTo("clear-password");
            assertThat(user.getLastname()).isEqualTo("Dupont");
            assertThat(user.getFirstname()).isEqualTo("Jean");
            assertThat(user.getEmail()).isEqualTo("jean.dupont@example.com");
        }

        @Test
        @DisplayName("roles n'est jamais null : liste vide par defaut via le builder")
        void builder_withoutRoles_shouldDefaultToEmptyList() {
            User user = User.builder().id(1).username("jdupont").password("hashed").build();

            assertThat(user.getRoles()).isNotNull().isEmpty();
        }

        @Test
        @DisplayName("roles n'est jamais null : liste vide par defaut via le constructeur sans argument")
        void noArgsConstructor_shouldDefaultRolesToEmptyList() {
            User user = new User();

            assertThat(user.getRoles()).isNotNull().isEmpty();
        }
    }

    @Nested
    @DisplayName("Egalite et hashCode")
    class EqualityAndHashCode {

        @Test
        @DisplayName("Deux utilisateurs avec le meme id sont egaux, meme si les autres champs different")
        void equals_sameId_shouldBeEqualRegardlessOfOtherFields() {
            User user1 = User.builder().id(1).username("jdupont").password("p1").build();
            User user2 = User.builder().id(1).username("mmartin").password("p2").build();

            assertThat(user1).isEqualTo(user2);
            assertThat(user1.hashCode()).isEqualTo(user2.hashCode());
        }

        @Test
        @DisplayName("Deux utilisateurs avec des ids differents ne sont pas egaux")
        void equals_differentId_shouldNotBeEqual() {
            User user1 = User.builder().id(1).username("jdupont").build();
            User user2 = User.builder().id(2).username("jdupont").build();

            assertThat(user1).isNotEqualTo(user2);
        }
    }

    @Nested
    @DisplayName("Confidentialite des mots de passe")
    class PasswordConfidentiality {

        @Test
        @DisplayName("toString() ne doit jamais exposer password ni plainPassword")
        void toString_shouldNeverExposePasswords() {
            User user = User.builder()
                    .id(1)
                    .username("jdupont")
                    .password("S3cr3tHash")
                    .plainPassword("S3cr3tClear")
                    .build();

            String representation = user.toString();

            assertThat(representation)
                    .doesNotContain("S3cr3tHash")
                    .doesNotContain("S3cr3tClear");
        }

        @Test
        @DisplayName("plainPassword n'est pas un champ persistant (@Transient)")
        void plainPassword_shouldBeTransient() throws NoSuchFieldException {
            var field = User.class.getDeclaredField("plainPassword");

            assertThat(field.isAnnotationPresent(jakarta.persistence.Transient.class)).isTrue();
        }
    }

    @Nested
    @DisplayName("Validation Bean Validation")
    class Validation {

        @Test
        @DisplayName("Un username vide declenche une violation")
        void blankUsername_shouldTriggerViolation() {
            User user = User.builder().id(1).username(" ").password("hashed").build();

            Set<ConstraintViolation<User>> violations = ValidationSupport.VALIDATOR.validate(user);

            assertThat(violations).isNotEmpty();
        }

        @Test
        @DisplayName("Un password vide declenche une violation")
        void blankPassword_shouldTriggerViolation() {
            User user = User.builder().id(1).username("jdupont").password(" ").build();

            Set<ConstraintViolation<User>> violations = ValidationSupport.VALIDATOR.validate(user);

            assertThat(violations).isNotEmpty();
        }

        @Test
        @DisplayName("Un email au format invalide declenche une violation")
        void invalidEmail_shouldTriggerViolation() {
            User user = User.builder()
                    .id(1)
                    .username("jdupont")
                    .password("hashed")
                    .email("pas-un-email")
                    .build();

            Set<ConstraintViolation<User>> violations = ValidationSupport.VALIDATOR.validate(user);

            assertThat(violations).isNotEmpty();
        }

        @Test
        @DisplayName("Un utilisateur avec les champs obligatoires renseignes est valide (email absent accepte)")
        void validUser_shouldNotTriggerViolation() {
            User user = User.builder().id(1).username("jdupont").password("hashed").build();

            Set<ConstraintViolation<User>> violations = ValidationSupport.VALIDATOR.validate(user);

            assertThat(violations).isEmpty();
        }
    }
}
