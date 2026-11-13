package com.obracerta.controller;

import com.obracerta.exception.GlobalExceptionHandler;
import com.obracerta.model.entity.User;
import com.obracerta.repository.UserRepository;
import com.obracerta.services.AuthService;
import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.sql.SQLException;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthRegistrationContractTest {
    private static final String EMAIL = "pessoa@example.com";
    private final UserRepository repository = mock(UserRepository.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        var service = new AuthService();
        ReflectionTestUtils.setField(service, "repository", repository);
        ReflectionTestUtils.setField(service, "passwordEncoder", encoder);
        var controller = new AuthController();
        ReflectionTestUtils.setField(controller, "authService", service);
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void reportsAnAlreadyRegisteredEmail() throws Exception {
        when(repository.findByEmail(EMAIL)).thenReturn(Optional.of(mock(User.class)));

        expectDuplicateEmail();

        verifyNoInteractions(encoder);
    }

    @Test
    void reportsADuplicateEmailDetectedWhileSaving() throws Exception {
        when(repository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(encoder.encode("senha123")).thenReturn("hash");
        when(repository.save(any(User.class))).thenThrow(new DataIntegrityViolationException(
                "constraint", new ConstraintViolationException(
                        "duplicate", new SQLException("duplicate", "23505"), "uk_users_email")));

        expectDuplicateEmail();
    }

    private void expectDuplicateEmail() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Pessoa","email":"pessoa@example.com","password":"senha123"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("E-mail já cadastrado"));
    }
}
