package com.example.spring_todolist.exception;

/**
 * Levee quand une valeur censee etre unique (username, email) est deja prise.
 * A mapper vers HTTP 409 par le gestionnaire d'exceptions global (couche
 * controller, a venir).
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}
