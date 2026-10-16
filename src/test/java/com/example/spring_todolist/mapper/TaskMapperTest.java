package com.example.spring_todolist.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;

import com.example.spring_todolist.dto.CategoryResponse;
import com.example.spring_todolist.dto.TaskRequest;
import com.example.spring_todolist.dto.TaskResponse;
import com.example.spring_todolist.entity.Category;
import com.example.spring_todolist.entity.Task;

import org.junit.jupiter.api.Test;

class TaskMapperTest {

    private final TaskMapper mapper = new TaskMapper(new CategoryMapper());

    @Test
    void toEntity_shouldMapDescriptionOnly_leavingCategoryNull() {
        TaskRequest request = new TaskRequest("Faire les courses", 1);

        Task task = mapper.toEntity(request);

        assertThat(task.getId()).isNull();
        assertThat(task.getDescription()).isEqualTo("Faire les courses");
        // La resolution de categoryId -> Category est a la charge du service (acces repository).
        assertThat(task.getCategory()).isNull();
    }

    @Test
    void updateEntity_shouldOverwriteDescriptionOnlyWithoutTouchingCategory() {
        Category category = Category.builder().id(1).label("Travail").build();
        Task existing = Task.builder().id(10).description("Ancienne").category(category).build();
        TaskRequest request = new TaskRequest("Nouvelle description", 1);

        mapper.updateEntity(request, existing);

        assertThat(existing.getDescription()).isEqualTo("Nouvelle description");
        assertThat(existing.getCategory()).isEqualTo(category);
    }

    @Test
    void toResponse_withCategory_shouldNestCategoryResponse() {
        Category category = Category.builder().id(1).label("Travail").color("#0000FF").build();
        LocalDateTime createdAt = LocalDateTime.of(2026, 1, 1, 10, 0);
        Task task = Task.builder().id(10).description("Rapport").createdAt(createdAt).category(category).build();

        TaskResponse response = mapper.toResponse(task);

        assertThat(response.id()).isEqualTo(10);
        assertThat(response.description()).isEqualTo("Rapport");
        assertThat(response.createdAt()).isEqualTo(createdAt);
        assertThat(response.category()).isEqualTo(new CategoryResponse(1, "Travail", "#0000FF"));
    }

    @Test
    void toResponse_withoutCategory_shouldHaveNullCategoryInResponse() {
        Task task = Task.builder().id(10).description("Sans categorie").build();

        TaskResponse response = mapper.toResponse(task);

        assertThat(response.category()).isNull();
    }

    @Test
    void toResponseList_shouldMapEachElement() {
        List<Task> tasks = List.of(
                Task.builder().id(1).description("A").build(),
                Task.builder().id(2).description("B").build());

        List<TaskResponse> responses = mapper.toResponseList(tasks);

        assertThat(responses)
                .extracting(TaskResponse::description)
                .containsExactly("A", "B");
    }
}
