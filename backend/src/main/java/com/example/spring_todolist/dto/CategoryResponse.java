package com.example.spring_todolist.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public record CategoryResponse(

        @Schema(description = "Identifiant de la categorie", example = "1")
        Integer id,

        @Schema(description = "Nom de la categorie", example = "Urgent")
        String label,

        @Schema(description = "Couleur au format hexadecimal", example = "#FF0000")
        String color) {
}
