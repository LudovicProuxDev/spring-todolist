package com.example.spring_todolist.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Donnees d'inscription. Volontairement sans champ "roles" : un utilisateur
 * ne doit jamais pouvoir s'auto-attribuer un role a l'inscription. Le role
 * par defaut est attribue par le service.
 */
public record UserCreateRequest(

        @NotBlank
        @Size(min = 3, max = 50)
        String username,

        @NotBlank
        @Size(min = 8, message = "password doit contenir au moins 8 caracteres")
        String password,

        String firstname,

        String lastname,

        @NotBlank
        @Email
        String email) {
}
