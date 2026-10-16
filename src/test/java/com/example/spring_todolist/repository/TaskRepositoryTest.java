package com.example.spring_todolist.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Optional;

import com.example.spring_todolist.entity.Category;
import com.example.spring_todolist.entity.Task;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
class TaskRepositoryTest {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void findByCategoryId_shouldReturnOnlyTasksOfThatCategory() {
        Category travail = categoryRepository.save(Category.builder().label("Travail").build());
        Category perso = categoryRepository.save(Category.builder().label("Perso").build());
        taskRepository.save(Task.builder().description("Rapport").category(travail).build());
        taskRepository.save(Task.builder().description("Courses").category(perso).build());
        taskRepository.save(Task.builder().description("Reunion").category(travail).build());

        List<Task> tasks = taskRepository.findByCategoryId(travail.getId());

        assertThat(tasks)
                .extracting(Task::getDescription)
                .containsExactlyInAnyOrder("Rapport", "Reunion");
    }

    @Test
    void findByCategoryId_withNoMatchingTask_shouldReturnEmptyList() {
        Category vide = categoryRepository.save(Category.builder().label("Vide").build());

        List<Task> tasks = taskRepository.findByCategoryId(vide.getId());

        assertThat(tasks).isEmpty();
    }

    @Test
    void save_withoutCategory_shouldPersistTaskWithNullCategory() {
        Task saved = taskRepository.save(Task.builder().description("Sans categorie").build());

        Optional<Task> found = taskRepository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getCategory()).isNull();
    }

    @Test
    void save_shouldAutomaticallySetCreatedAt() {
        Task saved = taskRepository.save(Task.builder().description("Avec horodatage").build());
        entityManager.flush();
        entityManager.clear();

        Task reloaded = taskRepository.findById(saved.getId()).orElseThrow();

        assertThat(reloaded.getCreatedAt()).isNotNull();
    }
}
