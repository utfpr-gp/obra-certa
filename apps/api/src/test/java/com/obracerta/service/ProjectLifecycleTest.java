package com.obracerta.service;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.sql.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
@Import(ProjectLifecycleTest.FixedClockConfiguration.class)
class ProjectLifecycleTest {

    private static final Instant DELETION_INSTANT = Instant.parse("2026-10-19T23:00:00Z");

    @TestConfiguration
    static class FixedClockConfiguration {
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(DELETION_INSTANT, java.time.ZoneOffset.UTC);
        }
    }

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

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void updatesProjectDataWithoutChangingBudgetOrExpenseAndSoftDeletesIt() throws Exception {
        User user = userRepository.saveAndFlush(User.builder()
                .name("Usuário da obra")
                .email("lifecycle-" + UUID.randomUUID() + "@example.com")
                .password(passwordEncoder.encode("senha-segura"))
                .userRole(UserRole.USER)
                .build());
        Project project = projectRepository.saveAndFlush(Project.builder()
                .user(user)
                .name("Obra original")
                .type(ProjectType.NEW_CONSTRUCTION)
                .location("Local original")
                .status(ProjectStatus.IN_PROGRESS)
                .build());
        String categoryId = UUID.randomUUID().toString();
        String supplierId = UUID.randomUUID().toString();
        String budgetId = UUID.randomUUID().toString();
        String expenseId = UUID.randomUUID().toString();
        jdbcTemplate.update("""
                INSERT INTO expense_categories (id, name) VALUES (?, ?)
                """, categoryId, "Categoria de teste");
        jdbcTemplate.update("""
                INSERT INTO suppliers (id, name) VALUES (?, ?)
                """, supplierId, "Fornecedor de teste");
        jdbcTemplate.update("""
                INSERT INTO budgets (id, user_id, category_id, project_id, estimated_amount)
                VALUES (?, ?, ?, ?, ?)
                """, budgetId, user.getId(), categoryId, project.getId(), 1000.00);
        jdbcTemplate.update("""
                INSERT INTO expenses (id, budget_id, user_id, category_id, supplier_id, project_id, total_price)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, expenseId, budgetId, user.getId(), categoryId, supplierId, project.getId(), 250.00);
        String pendingPaymentId = UUID.randomUUID().toString();
        jdbcTemplate.update("""
                INSERT INTO pending_payments (id, expense_id, due_date)
                VALUES (?, ?, ?)
                """, pendingPaymentId, expenseId, Date.valueOf("2026-11-01"));

        String token = authenticateAs(user);
        String updateJson = objectMapper.writeValueAsString(new com.obracerta.model.dto.project.ProjectUpdateDTO(
                "Obra atualizada", ProjectType.RENOVATION, ProjectStatus.PAUSED, "Novo local"));

        mockMvc.perform(put("/api/projects/{id}", project.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Obra atualizada"))
                .andExpect(jsonPath("$.type").value("RENOVATION"))
                .andExpect(jsonPath("$.status").value("PAUSED"))
                .andExpect(jsonPath("$.location").value("Novo local"));

        assertThat(jdbcTemplate.queryForObject(
                "SELECT project_id FROM budgets WHERE id = ?", String.class, budgetId))
                .isEqualTo(project.getId());
        assertThat(jdbcTemplate.queryForObject(
                "SELECT project_id FROM expenses WHERE id = ?", String.class, expenseId))
                .isEqualTo(project.getId());

        mockMvc.perform(delete("/api/projects/{id}", project.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        assertThat(projectRepository.findById(project.getId()).orElseThrow().getDeletedAt())
                .isEqualTo(DELETION_INSTANT);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT deleted_at FROM budgets WHERE id = ?", Instant.class, budgetId))
                .isEqualTo(DELETION_INSTANT);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT deleted_at FROM expenses WHERE id = ?", Instant.class, expenseId))
                .isEqualTo(DELETION_INSTANT);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT deleted_at FROM pending_payments WHERE id = ?", Instant.class, pendingPaymentId))
                .isEqualTo(DELETION_INSTANT);
        mockMvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void rejectsUpdateAndDeleteOfAnotherUsersProjectWithoutChangingIt() throws Exception {
        User owner = userRepository.saveAndFlush(User.builder()
                .name("Dono da obra")
                .email("owner-" + UUID.randomUUID() + "@example.com")
                .password(passwordEncoder.encode("senha-segura"))
                .userRole(UserRole.USER)
                .build());
        User intruder = userRepository.saveAndFlush(User.builder()
                .name("Outro usuário")
                .email("intruder-" + UUID.randomUUID() + "@example.com")
                .password(passwordEncoder.encode("senha-segura"))
                .userRole(UserRole.USER)
                .build());
        Project foreignProject = projectRepository.saveAndFlush(Project.builder()
                .user(owner)
                .name("Obra protegida")
                .type(ProjectType.EXPANSION)
                .location("Local protegido")
                .status(ProjectStatus.IN_PROGRESS)
                .build());
        String token = authenticateAs(intruder);
        String updateJson = objectMapper.writeValueAsString(new com.obracerta.model.dto.project.ProjectUpdateDTO(
                "Tentativa indevida", ProjectType.RENOVATION, ProjectStatus.COMPLETED, "Local alterado"));

        mockMvc.perform(put("/api/projects/{id}", foreignProject.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/projects/{id}", foreignProject.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());

        Project unchanged = projectRepository.findById(foreignProject.getId()).orElseThrow();
        assertThat(unchanged.getName()).isEqualTo("Obra protegida");
        assertThat(unchanged.getType()).isEqualTo(ProjectType.EXPANSION);
        assertThat(unchanged.getLocation()).isEqualTo("Local protegido");
        assertThat(unchanged.getStatus()).isEqualTo(ProjectStatus.IN_PROGRESS);
        assertThat(unchanged.getDeletedAt()).isNull();
    }

    private String authenticateAs(User user) throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"senha-segura"}
                                """.formatted(user.getEmail())))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }
}
