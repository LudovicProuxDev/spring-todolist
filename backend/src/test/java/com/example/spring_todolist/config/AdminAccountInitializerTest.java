package com.example.spring_todolist.config;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.example.spring_todolist.dto.UserCreateRequest;
import com.example.spring_todolist.service.UserService;

import jakarta.validation.Validation;
import jakarta.validation.Validator;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminAccountInitializerTest {

    @Mock
    private UserService userService;

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private AdminAccountInitializer initializer(String username, String password, String email) {
        return new AdminAccountInitializer(userService, validator, username, password, email);
    }

    @Test
    void run_whenUsernameNotConfigured_shouldDoNothing() {
        initializer("", "", "").run(null);

        verify(userService, never()).createAdminIfMissing(any());
    }

    @Test
    void run_whenFullyConfigured_shouldCreateAdminIfMissing() {
        initializer("admin", "adminSecret1", "admin@example.com").run(null);

        verify(userService).createAdminIfMissing(
                new UserCreateRequest("admin", "adminSecret1", null, null, "admin@example.com"));
    }

    @Test
    void run_whenPasswordTooShort_shouldFailFast() {
        assertThatThrownBy(() -> initializer("admin", "court", "admin@example.com").run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("password");
        verify(userService, never()).createAdminIfMissing(any());
    }

    @Test
    void run_whenEmailMissing_shouldFailFast() {
        assertThatThrownBy(() -> initializer("admin", "adminSecret1", "").run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("email");
        verify(userService, never()).createAdminIfMissing(any());
    }
}
