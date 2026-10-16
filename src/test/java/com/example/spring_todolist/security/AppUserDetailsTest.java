package com.example.spring_todolist.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class AppUserDetailsTest {

    @Test
    void shouldExposeIdAlongsideUsualUserDetailsFields() {
        AppUserDetails details = new AppUserDetails(
                1, "jdupont", "hashed", List.of(new SimpleGrantedAuthority("ROLE_USER")));

        assertThat(details.getId()).isEqualTo(1);
        assertThat(details.getUsername()).isEqualTo("jdupont");
        assertThat(details.getPassword()).isEqualTo("hashed");
        assertThat(details.getAuthorities())
                .extracting(Object::toString)
                .containsExactly("ROLE_USER");
    }
}
