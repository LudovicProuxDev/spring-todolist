package com.example.spring_todolist.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;

import org.springframework.context.annotation.Configuration;

/**
 * Metadonnees globales de la documentation OpenAPI (Swagger UI sur
 * /swagger-ui/index.html, JSON brut sur /v3/api-docs). Le schema
 * "bearerAuth" est defini ici une fois et reference individuellement par
 * les endpoints qui exigent reellement un jeton (@SecurityRequirement sur
 * UserController) : /api/auth/**, /api/categories et /api/tasks restent
 * documentes comme publics, conformement a SecurityConfig.
 */
@OpenAPIDefinition(
        info = @Info(
                title = "Spring Todolist API",
                version = "0.0.1",
                description = "API REST pour une todolist : categories, taches et utilisateurs, "
                        + "avec authentification JWT.",
                contact = @Contact(name = "Ludovic Proux")))
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Jeton obtenu via POST /api/auth/login, a fournir sous la forme "
                + "\"Authorization: Bearer <jeton>\".")
@Configuration
public class OpenApiConfig {
}
