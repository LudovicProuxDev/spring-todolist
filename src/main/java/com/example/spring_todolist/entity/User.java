package com.example.spring_todolist.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
// "user" est un mot reserve en PostgreSQL : on mappe la table sur "users".
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Integer id;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String username;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role", nullable = false)
    @Builder.Default
    private List<String> roles = new ArrayList<>();

    // Mot de passe hache, seul a etre persiste.
    @NotBlank
    @ToString.Exclude
    @Column(nullable = false)
    private String password;

    // Champ transitoire utilise pour la saisie/validation du mot de passe en clair
    // (ex. formulaire d'inscription) avant hachage vers "password" ; jamais persiste.
    @Transient
    @ToString.Exclude
    private String plainPassword;

    private String lastname;

    private String firstname;

    @Email
    @Column(unique = true)
    private String email;
}
