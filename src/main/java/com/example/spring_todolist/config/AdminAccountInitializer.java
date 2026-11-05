package com.example.spring_todolist.config;

import java.util.stream.Collectors;

import com.example.spring_todolist.dto.UserCreateRequest;
import com.example.spring_todolist.service.UserService;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Cree le premier compte administrateur au demarrage, a partir de
 * app.admin.username / app.admin.password / app.admin.email (variables
 * d'environnement APP_ADMIN_*). Sans cela, aucun admin ne peut exister : les
 * comptes crees via l'API recoivent toujours ROLE_USER.
 *
 * Desactive si app.admin.username est vide. S'il est renseigne, les autres
 * valeurs doivent respecter les memes regles qu'une inscription, sinon le
 * demarrage echoue (mieux qu'un admin silencieusement absent).
 */
@Slf4j
@Component
public class AdminAccountInitializer implements ApplicationRunner {

    private final UserService userService;
    private final Validator validator;
    private final String username;
    private final String password;
    private final String email;

    public AdminAccountInitializer(
            UserService userService,
            Validator validator,
            @Value("${app.admin.username:}") String username,
            @Value("${app.admin.password:}") String password,
            @Value("${app.admin.email:}") String email) {
        this.userService = userService;
        this.validator = validator;
        this.username = username;
        this.password = password;
        this.email = email;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (username == null || username.isBlank()) {
            return;
        }

        UserCreateRequest request = new UserCreateRequest(username, password, null, null, email);
        var violations = validator.validate(request);
        if (!violations.isEmpty()) {
            String details = violations.stream()
                    .map(ConstraintViolation::getPropertyPath)
                    .map(Object::toString)
                    .sorted()
                    .collect(Collectors.joining(", "));
            throw new IllegalStateException(
                    "Configuration du compte administrateur invalide (app.admin.*) : " + details);
        }

        if (userService.createAdminIfMissing(request)) {
            log.info("Compte administrateur initial cree : {}", username);
        } else {
            log.info("Compte administrateur initial deja present : {}", username);
        }
    }
}
