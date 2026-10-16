package com.example.spring_todolist.dto;

import java.util.List;

// Ne contient jamais password ni plainPassword.
public record UserResponse(
        Integer id,
        String username,
        String firstname,
        String lastname,
        String email,
        List<String> roles) {
}
