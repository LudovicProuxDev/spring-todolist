package com.example.spring_todolist.dto;

import java.time.Instant;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Corps renvoye par l'API pour toute erreur (4xx)")
public record ApiError(

        @Schema(description = "Horodatage de l'erreur")
        Instant timestamp,

        @Schema(description = "Code de statut HTTP", example = "404")
        int status,

        @Schema(description = "Message explicatif", example = "Categorie introuvable : id=99")
        String message) {

    public ApiError(int status, String message) {
        this(Instant.now(), status, message);
    }
}
