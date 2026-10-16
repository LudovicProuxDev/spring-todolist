package com.example.spring_todolist.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public record AuthResponse(

        @Schema(description = "Jeton JWT a fournir en en-tete Authorization: Bearer <jeton>",
                example = "eyJhbGciOiJIUzI1NiJ9...")
        String token) {
}
