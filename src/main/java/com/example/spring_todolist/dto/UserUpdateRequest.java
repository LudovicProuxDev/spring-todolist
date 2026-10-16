package com.example.spring_todolist.dto;

import java.util.List;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * Mise a jour partielle : un champ null signifie "ne pas modifier".
 * "roles" ne devrait pouvoir etre renseigne que par un administrateur ;
 * cette regle d'autorisation sera appliquee par la couche securite, pas ici.
 */
public record UserUpdateRequest(

        String firstname,

        String lastname,

        @Email
        String email,

        @Size(min = 8, message = "password doit contenir au moins 8 caracteres")
        String password,

        List<String> roles) {
}
