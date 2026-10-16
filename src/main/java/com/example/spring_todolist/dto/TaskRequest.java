package com.example.spring_todolist.dto;

import jakarta.validation.constraints.NotBlank;

public record TaskRequest(

        @NotBlank
        String description,

        // Optionnelle : une tache peut ne pas etre rattachee a une categorie.
        Integer categoryId) {
}
