package com.example.spring_todolist.mapper;

import java.util.List;

import com.example.spring_todolist.dto.CategoryRequest;
import com.example.spring_todolist.dto.CategoryResponse;
import com.example.spring_todolist.entity.Category;

import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public Category toEntity(CategoryRequest request) {
        return Category.builder()
                .label(request.label())
                .color(request.color())
                .build();
    }

    public void updateEntity(CategoryRequest request, Category category) {
        category.setLabel(request.label());
        category.setColor(request.color());
    }

    public CategoryResponse toResponse(Category category) {
        if (category == null) {
            return null;
        }
        return new CategoryResponse(category.getId(), category.getLabel(), category.getColor());
    }

    public List<CategoryResponse> toResponseList(List<Category> categories) {
        return categories.stream().map(this::toResponse).toList();
    }
}
