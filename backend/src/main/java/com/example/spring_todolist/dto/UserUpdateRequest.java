package com.example.spring_todolist.dto;

import java.util.List;

import com.example.spring_todolist.entity.Role;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * Mise a jour partielle : un champ null signifie "ne pas modifier".
 * "roles" ne peut etre renseigne que par un administrateur - verifie par
 * UserController, qui rejette (403) toute tentative venant d'un non-admin.
 * Type Role (enum) plutot que String : une valeur hors vocabulaire connu
 * est rejetee au parsing JSON (400), avant meme d'atteindre le controller.
 */
public record UserUpdateRequest(

        @Schema(description = "Nouveau prenom (optionnel, null = inchange)", example = "Jean")
        String firstname,

        @Schema(description = "Nouveau nom de famille (optionnel, null = inchange)", example = "Dupont")
        String lastname,

        @Schema(description = "Nouvelle adresse email (optionnel, null = inchange)",
                example = "jean.dupont@example.com")
        @Email
        String email,

        @Schema(description = "Nouveau mot de passe en clair, 8 caracteres minimum "
                + "(optionnel, null = inchange)", example = "nouveauSecret1")
        @Size(min = 8, message = "password doit contenir au moins 8 caracteres")
        String password,

        @Schema(description = "Nouveaux roles - reserve a un administrateur, "
                + "sinon la requete est rejetee (optionnel, null = inchange)",
                example = "[\"ROLE_USER\"]")
        List<Role> roles) {
}
