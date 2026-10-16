package com.example.spring_todolist.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Optional;

import com.example.spring_todolist.entity.Category;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;

/**
 * Pas de comportement personnalise a piloter par TDD ici (JpaRepository suffit) :
 * ce test verifie que le mapping JPA de Category (table/colonnes) fonctionne
 * reellement contre PostgreSQL.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
class CategoryRepositoryTest {

    @Autowired
    private CategoryRepository categoryRepository;

    @Test
    void save_thenFindById_shouldReturnPersistedCategory() {
        Category saved = categoryRepository.save(Category.builder().label("Urgent").color("#FF0000").build());

        Optional<Category> found = categoryRepository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getLabel()).isEqualTo("Urgent");
        assertThat(found.get().getColor()).isEqualTo("#FF0000");
    }

    @Test
    void deleteById_shouldRemoveCategory() {
        Category saved = categoryRepository.save(Category.builder().label("A supprimer").build());

        categoryRepository.deleteById(saved.getId());

        assertThat(categoryRepository.findById(saved.getId())).isEmpty();
    }
}
