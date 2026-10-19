package com.obracerta.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.obracerta.model.dto.AuthDTO;
import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
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

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
class ProjectAntiIdorIntegrationTest {

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

    private static final String USER_PASSWORD = "senha-segura";

    @Test
    void deniesAnotherUsersExistingProjectWithTheSamePayloadAsUnknownIdAndDoesNotMutateIt() throws Exception {
        User userA = persistUser("a");
        User userB = persistUser("b");
        Project projectOfB = projectRepository.saveAndFlush(Project.builder()
                .user(userB)
                .name("Obra privada de B")
                .type(ProjectType.RENOVATION)
                .status(ProjectStatus.IN_PROGRESS)
                .location("Local privado de B")
                .build());
        ProjectSnapshot beforeRequest = snapshot(projectOfB);
        String unknownId = UUID.randomUUID().toString();
        String token = authenticateAs(userA);

        String foreignProjectError = mockMvc.perform(get("/api/projects/{id}", projectOfB.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andReturn().getResponse().getContentAsString();
        String unknownProjectError = mockMvc.perform(get("/api/projects/{id}", unknownId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andReturn().getResponse().getContentAsString();

        assertThat(normalizeError(foreignProjectError))
                .isEqualTo(normalizeError(unknownProjectError));
        assertThat(projectRepository.findById(projectOfB.getId()))
                .get()
                .satisfies(project -> assertThat(snapshot(project)).isEqualTo(beforeRequest));
    }

    private ProjectSnapshot snapshot(Project project) {
        return new ProjectSnapshot(
                project.getUser().getId(),
                project.getName(),
                project.getType(),
                project.getLocation(),
                project.getStatus(),
                project.getCreatedAt(),
                project.getUpdatedAt(),
                project.getDeletedAt());
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
                .email("integration-" + suffix + "-" + UUID.randomUUID() + "@example.com")
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

    private record ProjectSnapshot(
            String userId,
            String name,
            ProjectType type,
            String location,
            ProjectStatus status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            LocalDateTime deletedAt) {
    }
}
