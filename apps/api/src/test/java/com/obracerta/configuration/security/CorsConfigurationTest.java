package com.obracerta.configuration.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * As origens aceitas pelo CORS vem de configuracao (CORS_ALLOWED_ORIGINS), para que
 * o frontend publicado em outro dominio consiga chamar a API sem alterar codigo.
 */
@SpringBootTest(properties = "obracerta.cors.allowed-origins=https://obracerta.example.com,http://localhost:4200")
@ActiveProfiles("test")
@AutoConfigureMockMvc
class CorsConfigurationTest {

    @Autowired private MockMvc mockMvc;

    @Test
    void acceptsConfiguredProductionOrigin() throws Exception {
        mockMvc.perform(options("/api/projects")
                        .header("Origin", "https://obracerta.example.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://obracerta.example.com"));
    }

    @Test
    void keepsLocalDevelopmentOriginWhenListed() throws Exception {
        mockMvc.perform(options("/api/projects")
                        .header("Origin", "http://localhost:4200")
                        .header("Access-Control-Request-Method", "PUT"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"));
    }

    @Test
    void rejectsUnlistedOrigin() throws Exception {
        mockMvc.perform(options("/api/projects")
                        .header("Origin", "https://site-qualquer.example.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
