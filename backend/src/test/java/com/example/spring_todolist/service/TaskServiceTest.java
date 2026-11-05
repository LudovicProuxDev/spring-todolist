package com.example.spring_todolist.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import com.example.spring_todolist.dto.TaskRequest;
import com.example.spring_todolist.dto.TaskResponse;
import com.example.spring_todolist.entity.Category;
import com.example.spring_todolist.entity.Task;
import com.example.spring_todolist.exception.ResourceNotFoundException;
import com.example.spring_todolist.mapper.CategoryMapper;
import com.example.spring_todolist.mapper.TaskMapper;
import com.example.spring_todolist.repository.CategoryRepository;
import com.example.spring_todolist.repository.TaskRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private CategoryRepository categoryRepository;

    private TaskService taskService;

    @BeforeEach
    void setUp() {
        taskService = new TaskService(taskRepository, categoryRepository, new TaskMapper(new CategoryMapper()));
    }

    @Test
    void findAll_withoutCategoryId_shouldReturnAllTasks() {
        when(taskRepository.findAll()).thenReturn(List.of(Task.builder().id(1).description("A").build()));

        List<TaskResponse> responses = taskService.findAll(null);

        assertThat(responses).extracting(TaskResponse::description).containsExactly("A");
        verify(taskRepository, never()).findByCategoryId(any());
    }

    @Test
    void findAll_withCategoryId_shouldReturnFilteredTasks() {
        when(taskRepository.findByCategoryId(1)).thenReturn(List.of(Task.builder().id(1).description("A").build()));

        List<TaskResponse> responses = taskService.findAll(1);

        assertThat(responses).extracting(TaskResponse::description).containsExactly("A");
        verify(taskRepository, never()).findAll();
    }

    @Test
    void findById_whenExists_shouldReturnResponse() {
        when(taskRepository.findById(1)).thenReturn(Optional.of(Task.builder().id(1).description("A").build()));

        TaskResponse response = taskService.findById(1);

        assertThat(response.description()).isEqualTo("A");
    }

    @Test
    void findById_whenMissing_shouldThrowResourceNotFoundException() {
        when(taskRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.findById(99)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_withoutCategoryId_shouldSaveTaskWithoutCategory() {
        TaskRequest request = new TaskRequest("Sans categorie", null);
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TaskResponse response = taskService.create(request);

        assertThat(response.category()).isNull();
        verify(categoryRepository, never()).findById(any());
    }

    @Test
    void create_withCategoryId_shouldResolveCategoryAndSave() {
        Category category = Category.builder().id(1).label("Travail").build();
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));
        TaskRequest request = new TaskRequest("Rapport", 1);

        TaskResponse response = taskService.create(request);

        assertThat(response.category().id()).isEqualTo(1);
    }

    @Test
    void create_withInvalidCategoryId_shouldThrowResourceNotFoundException() {
        when(categoryRepository.findById(99)).thenReturn(Optional.empty());
        TaskRequest request = new TaskRequest("Rapport", 99);

        assertThatThrownBy(() -> taskService.create(request)).isInstanceOf(ResourceNotFoundException.class);
        verify(taskRepository, never()).save(any());
    }

    @Test
    void update_whenExists_shouldApplyChangesAndReassignCategory() {
        Task existing = Task.builder().id(1).description("Ancienne").build();
        Category category = Category.builder().id(2).label("Perso").build();
        when(taskRepository.findById(1)).thenReturn(Optional.of(existing));
        when(categoryRepository.findById(2)).thenReturn(Optional.of(category));
        when(taskRepository.save(existing)).thenReturn(existing);
        TaskRequest request = new TaskRequest("Nouvelle", 2);

        TaskResponse response = taskService.update(1, request);

        assertThat(response.description()).isEqualTo("Nouvelle");
        assertThat(response.category().id()).isEqualTo(2);
    }

    @Test
    void update_whenMissing_shouldThrowResourceNotFoundException() {
        when(taskRepository.findById(99)).thenReturn(Optional.empty());
        TaskRequest request = new TaskRequest("Nouvelle", null);

        assertThatThrownBy(() -> taskService.update(99, request)).isInstanceOf(ResourceNotFoundException.class);
        verify(taskRepository, never()).save(any());
    }

    @Test
    void delete_whenExists_shouldCallRepositoryDelete() {
        when(taskRepository.existsById(1)).thenReturn(true);

        taskService.delete(1);

        verify(taskRepository).deleteById(1);
    }

    @Test
    void delete_whenMissing_shouldThrowResourceNotFoundException() {
        when(taskRepository.existsById(99)).thenReturn(false);

        assertThatThrownBy(() -> taskService.delete(99)).isInstanceOf(ResourceNotFoundException.class);
        verify(taskRepository, never()).deleteById(any());
    }
}
