package com.example.spring_todolist.security;

import java.io.IOException;

import com.example.spring_todolist.dto.ApiError;

import tools.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

/**
 * Sans point d'entree explicite, Spring Security renvoie 403 pour une
 * requete non authentifiee (httpBasic/formLogin desactives n'en fournissent
 * plus par defaut) ce qui est semantiquement faux pour une API : 401 =
 * "authentifie-toi", 403 = "tu es authentifie mais pas autorise". Ce point
 * d'entree force le 401 et garde un corps JSON coherent avec le reste de
 * l'API (ApiError).
 */
@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(
            HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(
                response.getWriter(),
                new ApiError(HttpStatus.UNAUTHORIZED.value(), "Authentification requise"));
    }
}
