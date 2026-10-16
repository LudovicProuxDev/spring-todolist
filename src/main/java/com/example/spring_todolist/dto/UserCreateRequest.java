package com.example.spring_todolist.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Donnees d'inscription. Volontairement sans champ "roles" : un utilisateur
 * ne doit jamais pouvoir s'auto-attribuer un role a l'inscription. Le role
 * par defaut est attribue par le service.
 */
public record UserCreateRequest(

        @Schema(description = "Nom d'utilisateur (3 a 50 caracteres)", example = "jdupont")
        @NotBlank
        @Size(min = 3, max = 50)
        String username,

        @Schema(description = "Mot de passe en clair (8 caracteres minimum), hache cote serveur",
                example = "secret123")
        @NotBlank
        @Size(min = 8, message = "password doit contenir au moins 8 caracteres")
        String password,

        @Schema(description = "Prenom (optionnel)", example = "Jean")
        String firstname,

        @Schema(description = "Nom de famille (optionnel)", example = "Dupont")
        String lastname,

        @Schema(description = "Adresse email", example = "jean.dupont@example.com")
        @NotBlank
        @Email
        String email) {
}
