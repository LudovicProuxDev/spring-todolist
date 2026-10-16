package com.example.spring_todolist.entity;

import jakarta.validation.Validation;
import jakarta.validation.Validator;

/**
 * Fournit un {@link Validator} Bean Validation partage pour les tests unitaires
 * des entites, sans demarrer de contexte Spring (tests purement unitaires).
 */
final class ValidationSupport {

    static final Validator VALIDATOR = Validation.buildDefaultValidatorFactory().getValidator();

    private ValidationSupport() {
    }
}
