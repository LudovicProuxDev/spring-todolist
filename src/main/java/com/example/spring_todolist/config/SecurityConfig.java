package com.example.spring_todolist.config;

import com.example.spring_todolist.security.JwtAuthenticationFilter;
import com.example.spring_todolist.security.RestAccessDeniedHandler;
import com.example.spring_todolist.security.RestAuthenticationEntryPoint;

import lombok.RequiredArgsConstructor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * API sans etat : pas de session, authentification par JWT (en-tete
 * Authorization) plutot que cookie/formulaire. /api/auth/** doit rester
 * public (on ne peut pas s'authentifier sans ca) ; /api/categories/** et
 * /api/tasks/** restent ouverts pour l'instant (decision prise avec
 * l'utilisateur) ; tout le reste - dont /api/users/** - exige un jeton
 * valide. @EnableMethodSecurity prepare les regles @PreAuthorize
 * "admin ou soi-meme" a venir sur le controller User.
 */
@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Sans ca, une route inconnue vers une ressource "ouverte" (ex.
                        // GET /api/categories sans controller mappe) renverrait 401 au
                        // lieu du 404 attendu : Spring Boot forward en interne vers
                        // /error pour generer la reponse d'erreur, et Security bloque ce
                        // forward s'il n'est pas explicitement autorise.
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        // "/**" ne couvre pas le chemin de base lui-meme (ex. l'appel
                        // sans id, "GET /api/categories") : il faut aussi le lister.
                        .requestMatchers("/api/categories", "/api/categories/**").permitAll()
                        .requestMatchers("/api/tasks", "/api/tasks/**").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(restAuthenticationEntryPoint)
                        .accessDeniedHandler(restAccessDeniedHandler))
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
