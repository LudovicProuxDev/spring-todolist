package com.example.spring_todolist.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CategoryRequest(

        @NotBlank
        String label,

        @Pattern(regexp = "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", message = "color doit etre un code hexadecimal (ex. #FF0000)")
        String color) {
}
