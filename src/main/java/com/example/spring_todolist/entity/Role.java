package com.example.spring_todolist.entity;

/**
 * Vocabulaire ferme des roles. Remplace un simple List&lt;String&gt; pour
 * qu'une valeur inconnue soit rejetee au parsing JSON (Jackson) plutot que
 * silencieusement persistee en base sans jamais correspondre a une regle
 * @PreAuthorize existante.
 */
public enum Role {
    ROLE_USER,
    ROLE_ADMIN
}
