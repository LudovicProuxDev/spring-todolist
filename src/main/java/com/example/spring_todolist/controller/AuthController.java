package com.example.spring_todolist.controller;

import com.example.spring_todolist.dto.ApiError;
import com.example.spring_todolist.dto.AuthResponse;
import com.example.spring_todolist.dto.LoginRequest;
import com.example.spring_todolist.dto.UserCreateRequest;
import com.example.spring_todolist.dto.UserResponse;
import com.example.spring_todolist.service.AuthService;
import com.example.spring_todolist.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Authentification", description = "Inscription et connexion (acces public)")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthService authService;

    @Operation(summary = "Creer un compte",
            description = "Le role ROLE_USER est attribue automatiquement ; il n'est pas possible "
                    + "de s'auto-attribuer un role a l'inscription.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Compte cree"),
        @ApiResponse(responseCode = "400", description = "Payload invalide (mot de passe trop court, email mal forme...)",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "409", description = "Nom d'utilisateur ou email deja pris",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody UserCreateRequest request) {
        return userService.register(request);
    }

    @Operation(summary = "Se connecter", description = "Renvoie un jeton JWT a utiliser en en-tete "
            + "Authorization: Bearer <jeton> sur les endpoints proteges.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Connexion reussie, jeton renvoye"),
        @ApiResponse(responseCode = "401", description = "Nom d'utilisateur ou mot de passe incorrect",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
