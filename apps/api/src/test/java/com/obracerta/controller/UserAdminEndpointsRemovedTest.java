package com.obracerta.controller;

import com.obracerta.configuration.security.TokenService;
import com.obracerta.enums.UserRole;
import com.obracerta.model.entity.User;
import com.obracerta.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * PRD, Fora de Escopo, item 3: o sistema nao tem modulo de administracao global de
 * usuarios. Nem um usuario com papel ADMIN encontra endpoints em /api/users.
 */
@SpringBootTest(properties = "api.security.token.secret=user-admin-removed-test-secret")
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
class UserAdminEndpointsRemovedTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private TokenService tokenService;

    private User admin;
    private String bearer;

    @BeforeEach
    void persistAdmin() {
        admin = userRepository.saveAndFlush(User.builder()
                .name("Administrador")
                .email("admin-" + UUID.randomUUID() + "@example.com")
                .password(passwordEncoder.encode("senha-segura"))
                .userRole(UserRole.ADMIN)
                .build());
        bearer = "Bearer " + tokenService.generateToken(admin);
    }

    @Test
    void listingUsersIsNotExposed() throws Exception {
        mockMvc.perform(get("/api/users").header("Authorization", bearer))
                .andExpect(status().isNotFound());
    }

    @Test
    void creatingUsersIsNotExposed() throws Exception {
        mockMvc.perform(post("/api/users")
                        .header("Authorization", bearer)
                        .contentType(APPLICATION_JSON)
                        .content("{\"name\":\"Outro\",\"email\":\"outro@example.com\",\"password\":\"senha123\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void changingUserRoleIsNotExposed() throws Exception {
        mockMvc.perform(put("/api/users/" + admin.getId() + "/role")
                        .header("Authorization", bearer)
                        .contentType(APPLICATION_JSON)
                        .content("{\"role\":\"USER\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deletingUsersIsNotExposed() throws Exception {
        mockMvc.perform(delete("/api/users/" + admin.getId()).header("Authorization", bearer))
                .andExpect(status().isNotFound());
    }
}
