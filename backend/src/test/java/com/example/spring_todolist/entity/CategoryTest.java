package com.example.spring_todolist.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import jakarta.validation.ConstraintViolation;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class CategoryTest {

    @Nested
    @DisplayName("Construction")
    class Construction {

        @Test
        @DisplayName("Le builder renseigne tous les champs")
        void builder_shouldPopulateAllFields() {
            Category category = Category.builder()
                    .id(1)
                    .label("Urgent")
                    .color("#FF0000")
                    .build();

            assertThat(category.getId()).isEqualTo(1);
            assertThat(category.getLabel()).isEqualTo("Urgent");
            assertThat(category.getColor()).isEqualTo("#FF0000");
        }

        @Test
        @DisplayName("Le constructeur sans argument puis les setters renseignent les champs")
        void noArgsConstructorThenSetters_shouldPopulateAllFields() {
            Category category = new Category();
            category.setId(2);
            category.setLabel("Perso");
            category.setColor("#00FF00");

            assertThat(category.getId()).isEqualTo(2);
            assertThat(category.getLabel()).isEqualTo("Perso");
            assertThat(category.getColor()).isEqualTo("#00FF00");
        }
    }

    @Nested
    @DisplayName("Egalite et hashCode")
    class EqualityAndHashCode {

        @Test
        @DisplayName("Deux categories avec le meme id sont egales, meme si les autres champs different")
        void equals_sameId_shouldBeEqualRegardlessOfOtherFields() {
            Category category1 = Category.builder().id(1).label("Urgent").color("#FF0000").build();
            Category category2 = Category.builder().id(1).label("Perso").color("#00FF00").build();

            assertThat(category1).isEqualTo(category2);
            assertThat(category1.hashCode()).isEqualTo(category2.hashCode());
        }

        @Test
        @DisplayName("Deux categories avec des ids differents ne sont pas egales")
        void equals_differentId_shouldNotBeEqual() {
            Category category1 = Category.builder().id(1).label("Urgent").build();
            Category category2 = Category.builder().id(2).label("Urgent").build();

            assertThat(category1).isNotEqualTo(category2);
        }

        @Test
        @DisplayName("Une categorie n'est pas egale a null ni a un autre type")
        void equals_nullOrOtherType_shouldNotBeEqual() {
            Category category = Category.builder().id(1).build();

            assertThat(category).isNotEqualTo(null);
            assertThat(category).isNotEqualTo("1");
        }
    }

    @Nested
    @DisplayName("Validation Bean Validation")
    class Validation {

        @Test
        @DisplayName("Un label vide ou absent declenche une violation")
        void blankLabel_shouldTriggerViolation() {
            Category category = Category.builder().id(1).label(" ").build();

            Set<ConstraintViolation<Category>> violations = ValidationSupport.VALIDATOR.validate(category);

            assertThat(violations).isNotEmpty();
        }

        @Test
        @DisplayName("Une categorie avec un label renseigne est valide (color est optionnelle)")
        void validLabel_shouldNotTriggerViolation() {
            Category category = Category.builder().id(1).label("Urgent").build();

            Set<ConstraintViolation<Category>> violations = ValidationSupport.VALIDATOR.validate(category);

            assertThat(violations).isEmpty();
        }
    }
}
