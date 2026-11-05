package com.example.spring_todolist.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Expose le PasswordEncoder independamment de la configuration globale de
 * securite (authentification JWT, regles d'acces), a venir dans une etape
 * dediee : UserService en a besoin dès maintenant pour hacher les mots de
 * passe a l'inscription et lors d'un changement de mot de passe.
 */
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
