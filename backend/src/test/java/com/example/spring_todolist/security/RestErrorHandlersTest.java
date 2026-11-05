package com.example.spring_todolist.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.spring_todolist.dto.ApiError;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;

import tools.jackson.databind.ObjectMapper;

/**
 * Verifie le corps JSON des 401/403 produits par la chaine de securite :
 * meme format ApiError que les erreurs gerees par GlobalExceptionHandler,
 * et aucun detail interne (message de l'exception) expose au client.
 */
class RestErrorHandlersTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void authenticationEntryPoint_shouldReturn401WithApiErrorBody() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        new RestAuthenticationEntryPoint(objectMapper).commence(
                new MockHttpServletRequest(), response,
                new InsufficientAuthenticationException("detail interne"));

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).startsWith(MediaType.APPLICATION_JSON_VALUE);
        ApiError body = objectMapper.readValue(response.getContentAsString(), ApiError.class);
        assertThat(body.status()).isEqualTo(401);
        assertThat(body.message()).isEqualTo("Authentification requise");
        assertThat(body.timestamp()).isNotNull();
    }

    @Test
    void accessDeniedHandler_shouldReturn403WithApiErrorBody() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        new RestAccessDeniedHandler(objectMapper).handle(
                new MockHttpServletRequest(), response,
                new AccessDeniedException("Seul un administrateur peut modifier les roles"));

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentType()).startsWith(MediaType.APPLICATION_JSON_VALUE);
        ApiError body = objectMapper.readValue(response.getContentAsString(), ApiError.class);
        assertThat(body.status()).isEqualTo(403);
        assertThat(body.message()).isEqualTo("Acces refuse");
    }
}
