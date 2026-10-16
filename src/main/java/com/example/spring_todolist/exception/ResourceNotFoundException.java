package com.example.spring_todolist.exception;

/**
 * Levee quand une ressource identifiee par son id (ou une reference, ex.
 * categoryId sur une Task) n'existe pas. A mapper vers HTTP 404 par le
 * gestionnaire d'exceptions global (couche controller, a venir).
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
