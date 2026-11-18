package com.obracerta.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
import com.obracerta.model.dto.AuthDTO;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.User;
import com.obracerta.repository.ProjectRepository;
import com.obracerta.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * A leitura do painel nao pode revelar a existencia de obra de outro proprietario nem
 * cair em 500 com id malformado: os tres casos precisam devolver o mesmo 404.
 */
@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
class BudgetAntiIdorIntegrationTest {

    private static final String USER_PASSWORD = "senha-segura";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void deniesAnotherUsersProjectAndUnknownOrMalformedIdsWithTheSameNotFoundPayload() throws Exception {
        User userA = persistUser("a");
        User userB = persistUser("b");
        Project projectOfB = projectRepository.saveAndFlush(Project.builder()
                .user(userB)
                .name("Obra privada de B")
                .type(ProjectType.RENOVATION)
                .status(ProjectStatus.IN_PROGRESS)
                .location("Local privado de B")
                .build());
        String token = authenticateAs(userA);

        String foreignProjectError = mockMvc.perform(get("/api/budgets")
                        .param("projectId", projectOfB.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andReturn().getResponse().getContentAsString();
        String unknownProjectError = mockMvc.perform(get("/api/budgets")
                        .param("projectId", UUID.randomUUID().toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andReturn().getResponse().getContentAsString();
        String malformedProjectError = mockMvc.perform(get("/api/budgets")
                        .param("projectId", "not-a-uuid")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andReturn().getResponse().getContentAsString();

        assertThat(normalizeError(foreignProjectError))
                .as("Obra de outro usuario e obra inexistente devem ser indistinguiveis")
                .isEqualTo(normalizeError(unknownProjectError))
                .isEqualTo(normalizeError(malformedProjectError));
        assertThat(objectMapper.readTree(foreignProjectError).get("message").asText())
                .isEqualTo("Projeto não encontrado");
    }

    private JsonNode normalizeError(String response) throws Exception {
        JsonNode error = objectMapper.readTree(response);
        ((com.fasterxml.jackson.databind.node.ObjectNode) error).remove("timestamp");
        ((com.fasterxml.jackson.databind.node.ObjectNode) error).remove("path");
        return error;
    }

    private User persistUser(String suffix) {
        return userRepository.saveAndFlush(User.builder()
                .name("Usuário " + suffix)
                .email("budget-integration-" + suffix + "-" + UUID.randomUUID() + "@example.com")
                .password(passwordEncoder.encode(USER_PASSWORD))
                .userRole(UserRole.USER)
                .build());
    }

    private String authenticateAs(User user) throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new AuthDTO(user.getEmail(), USER_PASSWORD))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }
}
