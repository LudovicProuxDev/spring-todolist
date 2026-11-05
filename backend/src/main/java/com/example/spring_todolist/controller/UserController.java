package com.example.spring_todolist.controller;

import java.util.List;

import com.example.spring_todolist.dto.ApiError;
import com.example.spring_todolist.dto.UserCreateRequest;
import com.example.spring_todolist.dto.UserResponse;
import com.example.spring_todolist.dto.UserUpdateRequest;
import com.example.spring_todolist.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Utilisateurs", description = "Gestion des comptes (authentification requise)")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private static final String ADMIN_ROLE = "ROLE_ADMIN";

    private final UserService userService;

    @Operation(summary = "Creer un utilisateur", description = "Reserve aux administrateurs. "
            + "Le compte cree recoit toujours ROLE_USER par defaut, comme a l'inscription publique "
            + "(/api/auth/register) : cet endpoint ne permet pas non plus d'attribuer un role a la creation.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Utilisateur cree"),
        @ApiResponse(responseCode = "400", description = "Payload invalide",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "401", description = "Authentification requise",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "403", description = "Reserve aux administrateurs",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "409", description = "Nom d'utilisateur ou email deja pris",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody UserCreateRequest request) {
        return userService.register(request);
    }

    @Operation(summary = "Lister tous les utilisateurs", description = "Reserve aux administrateurs.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Liste des utilisateurs"),
        @ApiResponse(responseCode = "401", description = "Authentification requise",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "403", description = "Reserve aux administrateurs",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> findAll() {
        return userService.findAll();
    }

    @Operation(summary = "Profil de l'utilisateur authentifie")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Profil de l'utilisateur connecte"),
        @ApiResponse(responseCode = "401", description = "Authentification requise",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        return userService.findByUsername(authentication.getName());
    }

    @Operation(summary = "Recuperer un utilisateur par son id",
            description = "Reserve a l'administrateur ou au titulaire du compte.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Utilisateur trouve"),
        @ApiResponse(responseCode = "401", description = "Authentification requise",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "403", description = "Reserve a l'administrateur ou au titulaire du compte",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Utilisateur introuvable",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public UserResponse findById(@Parameter(description = "Id de l'utilisateur") @PathVariable Integer id) {
        return userService.findById(id);
    }

    @Operation(summary = "Mettre a jour un utilisateur",
            description = "Reserve a l'administrateur ou au titulaire du compte. Mise a jour partielle "
                    + "(un champ absent ou null n'est pas modifie). Seul un administrateur peut renseigner "
                    + "le champ roles ; sinon la requete est rejetee (403), meme sur son propre compte.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Utilisateur mis a jour"),
        @ApiResponse(responseCode = "400", description = "Payload invalide",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "401", description = "Authentification requise",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "403",
                description = "Reserve a l'administrateur ou au titulaire du compte ; "
                        + "ou tentative de modifier roles sans etre administrateur",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Utilisateur introuvable",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public UserResponse update(
            @Parameter(description = "Id de l'utilisateur") @PathVariable Integer id,
            @Valid @RequestBody UserUpdateRequest request,
            Authentication authentication) {
        if (request.roles() != null && !isAdmin(authentication)) {
            throw new AccessDeniedException("Seul un administrateur peut modifier les roles");
        }
        return userService.update(id, request);
    }

    @Operation(summary = "Supprimer un utilisateur", description = "Reserve aux administrateurs.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Utilisateur supprime"),
        @ApiResponse(responseCode = "401", description = "Authentification requise",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "403", description = "Reserve aux administrateurs",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Utilisateur introuvable",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@Parameter(description = "Id de l'utilisateur") @PathVariable Integer id) {
        userService.delete(id);
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(ADMIN_ROLE));
    }
}
