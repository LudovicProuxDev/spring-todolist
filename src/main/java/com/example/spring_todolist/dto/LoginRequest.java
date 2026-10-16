package com.example.spring_todolist.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(

        @Schema(description = "Nom d'utilisateur", example = "jdupont")
        @NotBlank
        String username,

        @Schema(description = "Mot de passe en clair", example = "secret123")
        @NotBlank
        String password) {
}
