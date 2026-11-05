package com.example.spring_todolist.controller;

import java.util.List;

import com.example.spring_todolist.dto.ApiError;
import com.example.spring_todolist.dto.TaskRequest;
import com.example.spring_todolist.dto.TaskResponse;
import com.example.spring_todolist.service.TaskService;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Tasks", description = "Gestion des taches (acces public)")
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @Operation(summary = "Lister les taches", description = "Filtrable par categorie via le parametre categoryId.")
    @ApiResponse(responseCode = "200", description = "Liste des taches")
    @GetMapping
    public List<TaskResponse> findAll(
            @Parameter(description = "Id de categorie pour filtrer (optionnel)")
            @RequestParam(required = false) Integer categoryId) {
        return taskService.findAll(categoryId);
    }

    @Operation(summary = "Recuperer une tache par son id")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tache trouvee"),
        @ApiResponse(responseCode = "404", description = "Tache introuvable",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @GetMapping("/{id}")
    public TaskResponse findById(@Parameter(description = "Id de la tache") @PathVariable Integer id) {
        return taskService.findById(id);
    }

    @Operation(summary = "Creer une tache",
            description = "categoryId est optionnel ; s'il est fourni, la categorie doit exister.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Tache creee"),
        @ApiResponse(responseCode = "400", description = "Payload invalide (description manquante)",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "categoryId reference une categorie inexistante",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse create(@Valid @RequestBody TaskRequest request) {
        return taskService.create(request);
    }

    @Operation(summary = "Mettre a jour une tache")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tache mise a jour"),
        @ApiResponse(responseCode = "400", description = "Payload invalide",
                content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Tache ou categoryId introuvable",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PutMapping("/{id}")
    public TaskResponse update(
            @Parameter(description = "Id de la tache") @PathVariable Integer id,
            @Valid @RequestBody TaskRequest request) {
        return taskService.update(id, request);
    }

    @Operation(summary = "Supprimer une tache")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Tache supprimee"),
        @ApiResponse(responseCode = "404", description = "Tache introuvable",
                content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@Parameter(description = "Id de la tache") @PathVariable Integer id) {
        taskService.delete(id);
    }
}
