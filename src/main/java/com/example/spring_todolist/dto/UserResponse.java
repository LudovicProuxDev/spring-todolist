package com.example.spring_todolist.dto;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

// Ne contient jamais password ni plainPassword.
public record UserResponse(

        @Schema(description = "Identifiant de l'utilisateur", example = "1")
        Integer id,

        @Schema(description = "Nom d'utilisateur", example = "jdupont")
        String username,

        @Schema(description = "Prenom", example = "Jean")
        String firstname,

        @Schema(description = "Nom de famille", example = "Dupont")
        String lastname,

        @Schema(description = "Adresse email", example = "jean.dupont@example.com")
        String email,

        @Schema(description = "Roles de l'utilisateur", example = "[\"ROLE_USER\"]")
        List<String> roles) {
}
