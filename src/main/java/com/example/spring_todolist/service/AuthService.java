package com.example.spring_todolist.service;

import com.example.spring_todolist.dto.AuthResponse;
import com.example.spring_todolist.dto.LoginRequest;
import com.example.spring_todolist.entity.User;
import com.example.spring_todolist.exception.ResourceNotFoundException;
import com.example.spring_todolist.security.JwtService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private static final String INVALID_CREDENTIALS_MESSAGE = "Identifiants invalides";

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse login(LoginRequest request) {
        User user;
        try {
            user = userService.findEntityByUsername(request.username());
        } catch (ResourceNotFoundException e) {
            // Meme message/exception que pour un mauvais mot de passe : ne pas
            // reveler si c'est le nom d'utilisateur ou le mot de passe qui est faux.
            throw new BadCredentialsException(INVALID_CREDENTIALS_MESSAGE);
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadCredentialsException(INVALID_CREDENTIALS_MESSAGE);
        }

        String token = jwtService.generateToken(user.getUsername(), user.getRoles());
        return new AuthResponse(token);
    }
}
