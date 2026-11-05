package com.example.spring_todolist.dto;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;

public record TaskResponse(

        @Schema(description = "Identifiant de la tache", example = "1")
        Integer id,

        @Schema(description = "Description de la tache", example = "Faire les courses")
        String description,

        @Schema(description = "Date de creation, renseignee automatiquement")
        LocalDateTime createdAt,

        @Schema(description = "Categorie associee, absente si la tache n'en a pas")
        CategoryResponse category) {
}
