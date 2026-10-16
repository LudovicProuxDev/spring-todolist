package com.example.spring_todolist.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.NotBlank;

public record TaskRequest(

        @Schema(description = "Description de la tache", example = "Faire les courses")
        @NotBlank
        String description,

        @Schema(description = "Id de la categorie associee (optionnel)", example = "1")
        Integer categoryId) {
}
