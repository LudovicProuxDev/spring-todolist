package com.example.spring_todolist.security;

import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

/**
 * UserDetails porteur de l'id metier (Category/Task n'en ont pas besoin,
 * mais User si : permet d'ecrire des regles @PreAuthorize du type
 * "admin ou soi-meme" via authentication.principal.id, sans avoir a
 * recharger l'utilisateur en base a chaque verification d'autorisation.
 */
public class AppUserDetails extends User {

    private final Integer id;

    public AppUserDetails(Integer id, String username, String password, Collection<? extends GrantedAuthority> authorities) {
        super(username, password, authorities);
        this.id = id;
    }

    public Integer getId() {
        return id;
    }
}
