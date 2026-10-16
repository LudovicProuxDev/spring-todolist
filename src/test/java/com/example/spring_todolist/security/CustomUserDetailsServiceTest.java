package com.example.spring_todolist.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.List;

import com.example.spring_todolist.entity.User;
import com.example.spring_todolist.exception.ResourceNotFoundException;
import com.example.spring_todolist.service.UserService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserService userService;

    private CustomUserDetailsService customUserDetailsService;

    @Test
    void loadUserByUsername_whenExists_shouldReturnUserDetailsWithAuthorities() {
        customUserDetailsService = new CustomUserDetailsService(userService);
        User user = User.builder()
                .id(1)
                .username("jdupont")
                .password("hashed")
                .roles(List.of("ROLE_USER", "ROLE_ADMIN"))
                .build();
        when(userService.findEntityByUsername("jdupont")).thenReturn(user);

        UserDetails userDetails = customUserDetailsService.loadUserByUsername("jdupont");

        assertThat(userDetails.getUsername()).isEqualTo("jdupont");
        assertThat(userDetails.getPassword()).isEqualTo("hashed");
        assertThat(userDetails.getAuthorities())
                .extracting(Object::toString)
                .containsExactlyInAnyOrder("ROLE_USER", "ROLE_ADMIN");
        // L'id est necessaire pour les regles @PreAuthorize "admin ou soi-meme"
        // (authentication.principal.id) sur UserController.
        assertThat(userDetails).isInstanceOf(AppUserDetails.class);
        assertThat(((AppUserDetails) userDetails).getId()).isEqualTo(1);
    }

    @Test
    void loadUserByUsername_whenMissing_shouldThrowUsernameNotFoundException() {
        customUserDetailsService = new CustomUserDetailsService(userService);
        when(userService.findEntityByUsername("inconnu"))
                .thenThrow(new ResourceNotFoundException("introuvable"));

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername("inconnu"))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}
