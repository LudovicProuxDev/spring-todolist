package com.example.spring_todolist.dto;

import java.time.LocalDateTime;

public record TaskResponse(
        Integer id,
        String description,
        LocalDateTime createdAt,
        // null si la tache n'a pas de categorie.
        CategoryResponse category) {
}
