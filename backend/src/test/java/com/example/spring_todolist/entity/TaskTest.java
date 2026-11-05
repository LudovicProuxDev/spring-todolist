package com.example.spring_todolist.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.Set;

import jakarta.validation.ConstraintViolation;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class TaskTest {

    @Nested
    @DisplayName("Construction")
    class Construction {

        @Test
        @DisplayName("Le builder renseigne tous les champs, y compris la categorie associee")
        void builder_shouldPopulateAllFields() {
            Category category = Category.builder().id(1).label("Urgent").build();
            LocalDateTime createdAt = LocalDateTime.of(2026, 1, 1, 10, 0);

            Task task = Task.builder()
                    .id(10)
                    .description("Faire les courses")
                    .createdAt(createdAt)
                    .category(category)
                    .build();

            assertThat(task.getId()).isEqualTo(10);
            assertThat(task.getDescription()).isEqualTo("Faire les courses");
            assertThat(task.getCreatedAt()).isEqualTo(createdAt);
            assertThat(task.getCategory()).isEqualTo(category);
        }

        @Test
        @DisplayName("Une tache peut etre construite sans categorie (relation optionnelle)")
        void builder_withoutCategory_shouldLeaveCategoryNull() {
            Task task = Task.builder()
                    .id(10)
                    .description("Faire les courses")
                    .build();

            assertThat(task.getCategory()).isNull();
        }
    }

    @Nested
    @DisplayName("Egalite et hashCode")
    class EqualityAndHashCode {

        @Test
        @DisplayName("Deux taches avec le meme id sont egales, meme si les autres champs different")
        void equals_sameId_shouldBeEqualRegardlessOfOtherFields() {
            Task task1 = Task.builder().id(10).description("A").build();
            Task task2 = Task.builder().id(10).description("B").build();

            assertThat(task1).isEqualTo(task2);
            assertThat(task1.hashCode()).isEqualTo(task2.hashCode());
        }

        @Test
        @DisplayName("Deux taches avec des ids differents ne sont pas egales")
        void equals_differentId_shouldNotBeEqual() {
            Task task1 = Task.builder().id(10).description("A").build();
            Task task2 = Task.builder().id(20).description("A").build();

            assertThat(task1).isNotEqualTo(task2);
        }
    }

    @Nested
    @DisplayName("Horodatage de creation (@PrePersist)")
    class CreationTimestamp {

        @Test
        @DisplayName("onCreate renseigne createdAt quand il est absent")
        void onCreate_whenCreatedAtIsNull_shouldSetCurrentTimestamp() {
            Task task = new Task();

            task.onCreate();

            assertThat(task.getCreatedAt()).isNotNull();
            assertThat(task.getCreatedAt()).isBeforeOrEqualTo(LocalDateTime.now());
        }

        @Test
        @DisplayName("onCreate ne modifie pas createdAt quand il est deja renseigne")
        void onCreate_whenCreatedAtIsAlreadySet_shouldNotOverrideIt() {
            LocalDateTime original = LocalDateTime.of(2020, 1, 1, 0, 0);
            Task task = new Task();
            task.setCreatedAt(original);

            task.onCreate();

            assertThat(task.getCreatedAt()).isEqualTo(original);
        }
    }

    @Nested
    @DisplayName("Validation Bean Validation")
    class Validation {

        @Test
        @DisplayName("Une description vide ou absente declenche une violation")
        void blankDescription_shouldTriggerViolation() {
            Task task = Task.builder().id(1).description(" ").build();

            Set<ConstraintViolation<Task>> violations = ValidationSupport.VALIDATOR.validate(task);

            assertThat(violations).isNotEmpty();
        }

        @Test
        @DisplayName("Une tache avec une description renseignee est valide")
        void validDescription_shouldNotTriggerViolation() {
            Task task = Task.builder().id(1).description("Faire les courses").build();

            Set<ConstraintViolation<Task>> violations = ValidationSupport.VALIDATOR.validate(task);

            assertThat(violations).isEmpty();
        }
    }
}
