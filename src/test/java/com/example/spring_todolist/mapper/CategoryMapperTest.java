package com.example.spring_todolist.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import com.example.spring_todolist.dto.CategoryRequest;
import com.example.spring_todolist.dto.CategoryResponse;
import com.example.spring_todolist.entity.Category;

import org.junit.jupiter.api.Test;

class CategoryMapperTest {

    private final CategoryMapper mapper = new CategoryMapper();

    @Test
    void toEntity_shouldMapLabelAndColor() {
        CategoryRequest request = new CategoryRequest("Urgent", "#FF0000");

        Category category = mapper.toEntity(request);

        assertThat(category.getId()).isNull();
        assertThat(category.getLabel()).isEqualTo("Urgent");
        assertThat(category.getColor()).isEqualTo("#FF0000");
    }

    @Test
    void updateEntity_shouldOverwriteLabelAndColorWithoutTouchingId() {
        Category existing = Category.builder().id(1).label("Ancien").color("#000000").build();
        CategoryRequest request = new CategoryRequest("Nouveau", "#FFFFFF");

        mapper.updateEntity(request, existing);

        assertThat(existing.getId()).isEqualTo(1);
        assertThat(existing.getLabel()).isEqualTo("Nouveau");
        assertThat(existing.getColor()).isEqualTo("#FFFFFF");
    }

    @Test
    void toResponse_shouldMapAllFields() {
        Category category = Category.builder().id(1).label("Urgent").color("#FF0000").build();

        CategoryResponse response = mapper.toResponse(category);

        assertThat(response).isEqualTo(new CategoryResponse(1, "Urgent", "#FF0000"));
    }

    @Test
    void toResponse_withNull_shouldReturnNull() {
        assertThat(mapper.toResponse(null)).isNull();
    }

    @Test
    void toResponseList_shouldMapEachElement() {
        List<Category> categories = List.of(
                Category.builder().id(1).label("Urgent").build(),
                Category.builder().id(2).label("Perso").build());

        List<CategoryResponse> responses = mapper.toResponseList(categories);

        assertThat(responses)
                .extracting(CategoryResponse::label)
                .containsExactly("Urgent", "Perso");
    }
}
