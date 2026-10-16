package com.example.spring_todolist.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import com.example.spring_todolist.dto.CategoryRequest;
import com.example.spring_todolist.dto.CategoryResponse;
import com.example.spring_todolist.entity.Category;
import com.example.spring_todolist.exception.ResourceNotFoundException;
import com.example.spring_todolist.mapper.CategoryMapper;
import com.example.spring_todolist.repository.CategoryRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    private CategoryService categoryService;

    @BeforeEach
    void setUp() {
        categoryService = new CategoryService(categoryRepository, new CategoryMapper());
    }

    @Test
    void findAll_shouldReturnMappedResponses() {
        when(categoryRepository.findAll()).thenReturn(List.of(
                Category.builder().id(1).label("Urgent").build(),
                Category.builder().id(2).label("Perso").build()));

        List<CategoryResponse> responses = categoryService.findAll();

        assertThat(responses).extracting(CategoryResponse::label).containsExactly("Urgent", "Perso");
    }

    @Test
    void findById_whenExists_shouldReturnResponse() {
        Category category = Category.builder().id(1).label("Urgent").color("#FF0000").build();
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));

        CategoryResponse response = categoryService.findById(1);

        assertThat(response).isEqualTo(new CategoryResponse(1, "Urgent", "#FF0000"));
    }

    @Test
    void findById_whenMissing_shouldThrowResourceNotFoundException() {
        when(categoryRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.findById(99))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_shouldSaveAndReturnResponse() {
        CategoryRequest request = new CategoryRequest("Urgent", "#FF0000");
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category toSave = invocation.getArgument(0);
            toSave.setId(1);
            return toSave;
        });

        CategoryResponse response = categoryService.create(request);

        assertThat(response).isEqualTo(new CategoryResponse(1, "Urgent", "#FF0000"));
    }

    @Test
    void update_whenExists_shouldApplyChangesAndReturnResponse() {
        Category existing = Category.builder().id(1).label("Ancien").color("#000000").build();
        when(categoryRepository.findById(1)).thenReturn(Optional.of(existing));
        when(categoryRepository.save(existing)).thenReturn(existing);
        CategoryRequest request = new CategoryRequest("Nouveau", "#FFFFFF");

        CategoryResponse response = categoryService.update(1, request);

        assertThat(response).isEqualTo(new CategoryResponse(1, "Nouveau", "#FFFFFF"));
    }

    @Test
    void update_whenMissing_shouldThrowResourceNotFoundException() {
        when(categoryRepository.findById(99)).thenReturn(Optional.empty());
        CategoryRequest request = new CategoryRequest("Nouveau", null);

        assertThatThrownBy(() -> categoryService.update(99, request))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(categoryRepository, never()).save(any());
    }

    @Test
    void delete_whenExists_shouldCallRepositoryDelete() {
        when(categoryRepository.existsById(1)).thenReturn(true);

        categoryService.delete(1);

        verify(categoryRepository).deleteById(1);
    }

    @Test
    void delete_whenMissing_shouldThrowResourceNotFoundException() {
        when(categoryRepository.existsById(99)).thenReturn(false);

        assertThatThrownBy(() -> categoryService.delete(99))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(categoryRepository, never()).deleteById(any());
    }
}
