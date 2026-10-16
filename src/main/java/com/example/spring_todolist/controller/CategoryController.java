package com.example.spring_todolist.controller;

import java.util.List;

import com.example.spring_todolist.dto.ApiError;
import com.example.spring_todolist.dto.CategoryRequest;
import com.example.spring_todolist.dto.CategoryResponse;
import com.example.spring_todolist.service.CategoryService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Categories", description = "Gestion des categories de taches (acces public)")
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @Operation(summary = "Lister toutes les categories")
    @ApiResponse(responseCode = "200", description = "Liste des categories")
    @GetMapping
    public List<CategoryResponse> findAll() {
        return categoryService.findAll();
    }

    @Operation(summary = "Recuperer une categorie par son id")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Categorie trouvee"),
        @ApiResponse(responseCode = "404", description = "Categorie introuvable",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @GetMapping("/{id}")
    public CategoryResponse findById(@Parameter(description = "Id de la categorie") @PathVariable Integer id) {
        return categoryService.findById(id);
    }

    @Operation(summary = "Creer une categorie")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Categorie creee"),
        @ApiResponse(responseCode = "400", description = "Payload invalide (label manquant, couleur mal formee)",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(@Valid @RequestBody CategoryRequest request) {
        return categoryService.create(request);
    }

    @Operation(summary = "Mettre a jour une categorie")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Categorie mise a jour"),
        @ApiResponse(responseCode = "400", description = "Payload invalide",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Categorie introuvable",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PutMapping("/{id}")
    public CategoryResponse update(
            @Parameter(description = "Id de la categorie") @PathVariable Integer id,
            @Valid @RequestBody CategoryRequest request) {
        return categoryService.update(id, request);
    }

    @Operation(summary = "Supprimer une categorie")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Categorie supprimee"),
        @ApiResponse(responseCode = "404", description = "Categorie introuvable",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@Parameter(description = "Id de la categorie") @PathVariable Integer id) {
        categoryService.delete(id);
    }
}
