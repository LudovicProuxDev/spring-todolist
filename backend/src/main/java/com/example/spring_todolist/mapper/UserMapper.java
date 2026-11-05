package com.example.spring_todolist.mapper;

import java.util.List;

import com.example.spring_todolist.dto.UserCreateRequest;
import com.example.spring_todolist.dto.UserResponse;
import com.example.spring_todolist.dto.UserUpdateRequest;
import com.example.spring_todolist.entity.User;

import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public User toEntity(UserCreateRequest request) {
        // password (hache) et roles par defaut sont renseignes par le service,
        // pas par le mapper : le mot de passe en clair ne passe que par plainPassword.
        return User.builder()
                .username(request.username())
                .firstname(request.firstname())
                .lastname(request.lastname())
                .email(request.email())
                .plainPassword(request.password())
                .build();
    }

    public void updateEntity(UserUpdateRequest request, User user) {
        if (request.firstname() != null) {
            user.setFirstname(request.firstname());
        }
        if (request.lastname() != null) {
            user.setLastname(request.lastname());
        }
        if (request.email() != null) {
            user.setEmail(request.email());
        }
        if (request.password() != null) {
            // Le hachage du nouveau mot de passe est la responsabilite du service.
            user.setPlainPassword(request.password());
        }
        if (request.roles() != null) {
            // A n'autoriser que pour un administrateur : regle appliquee par la
            // couche securite, pas ici.
            user.setRoles(request.roles());
        }
    }

    public UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getFirstname(),
                user.getLastname(),
                user.getEmail(),
                user.getRoles());
    }

    public List<UserResponse> toResponseList(List<User> users) {
        return users.stream().map(this::toResponse).toList();
    }
}
