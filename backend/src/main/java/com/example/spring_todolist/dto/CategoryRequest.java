package com.example.spring_todolist.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CategoryRequest(

        @Schema(description = "Nom de la categorie", example = "Urgent")
        @NotBlank
        String label,

        @Schema(description = "Couleur au format hexadecimal (optionnelle)", example = "#FF0000")
        @Pattern(regexp = "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", message = "color doit etre un code hexadecimal (ex. #FF0000)")
        String color) {
}
