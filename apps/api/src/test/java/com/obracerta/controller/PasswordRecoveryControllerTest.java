package com.obracerta.controller;

import com.obracerta.exception.GlobalExceptionHandler;
import com.obracerta.exception.InvalidRecoveryTokenException;
import com.obracerta.service.PasswordRecoveryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class PasswordRecoveryControllerTest {
    private final PasswordRecoveryService service = mock(PasswordRecoveryService.class);
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new PasswordRecoveryController(service))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @Test
    void acceptsRequestsWithoutExposingAnAccount() throws Exception {
        for (String email : new String[]{"pessoa@example.com", "unknown@example.com"}) {
            mvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"" + email + "\"}"))
                    .andExpect(status().isOk()).andExpect(content().string(""));
            verify(service).request(email);
        }
    }

    @Test
    void rejectsMalformedEmail() throws Exception {
        mvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"invalid\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void rejectsMultibytePasswordBeyondEncoderLimit() throws Exception {
        mvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"token\",\"password\":\"" + "é".repeat(40) + "\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void returnsTheInvalidLinkMessage() throws Exception {
        doThrow(new InvalidRecoveryTokenException()).when(service).reset("token", "senhaNova");
        mvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"token\",\"password\":\"senhaNova\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Este link é inválido ou expirou. Solicite um novo link."));
    }
}
