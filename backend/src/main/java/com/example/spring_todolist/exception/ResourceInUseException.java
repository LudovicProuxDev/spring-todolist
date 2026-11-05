package com.example.spring_todolist.exception;

/**
 * Levee quand une ressource ne peut pas etre supprimee car d'autres en
 * dependent encore (ex. une categorie referencee par des taches). Mappee vers
 * HTTP 409 par GlobalExceptionHandler.
 */
public class ResourceInUseException extends RuntimeException {

    public ResourceInUseException(String message) {
        super(message);
    }
}
