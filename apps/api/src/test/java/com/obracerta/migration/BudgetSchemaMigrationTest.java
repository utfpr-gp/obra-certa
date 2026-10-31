package com.obracerta.migration;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationState;
import org.flywaydb.core.api.MigrationVersion;
import org.flywaydb.core.api.configuration.FluentConfiguration;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Prova que as migrations V6 e V7 aplicam as travas de orcamento exigidas pela US07.
 *
 * <p>Nenhum criterio de aceite e coberto diretamente aqui: esta e a base tecnica que
 * destrava CA1 (um unico orcamento ativo por obra/categoria), CA3 (categoria sem teto
 * representada por teto zerado) e CA4 (zeramento preservando o registro).
 *
 * <p>O perfil {@code test} e fixado explicitamente (o mesmo da CI) e o
 * {@code @Transactional} desfaz o que cada teste escreve no schema {@code public}. A
 * prova de deduplicacao roda em um schema descartavel ({@code budget_dedup_probe}),
 * porque precisa de duplicatas ativas <em>antes</em> da V6 rodar — algo impossivel de
 * montar no schema onde o indice unico parcial ja existe.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BudgetSchemaMigrationTest {

    private static final String BUDGETS_MIGRATION_VERSION = "6";
    private static final String CATEGORIES_MIGRATION_VERSION = "7";
    private static final String UNIQUE_INDEX_NAME = "idx_budgets_project_category_active";
    private static final String NON_NEGATIVE_CONSTRAINT_NAME = "ck_budgets_estimated_amount_non_negative";
    private static final String PROBE_SCHEMA = "budget_dedup_probe";

    /** Nomes exatos de {@code PREDEFINED_CATEGORIES} em {@code expense-category.model.ts}. */
    private static final List<String> PREDEFINED_CATEGORY_NAMES = List.of(
            "Fundação e Estrutura",
            "Alvenaria",
            "Elétrica",
            "Hidráulica",
            "Telhado e Cobertura",
            "Esquadrias e Vidros",
            "Acabamento e Pintura",
            "Mão de Obra",
            "Taxas e Serviços"
    );

    @Autowired
    private Flyway flyway;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Flyway deve aplicar V6 e V7 com sucesso")
    void shouldApplyV6AndV7Migrations() {
        assertAppliedSuccessfully(BUDGETS_MIGRATION_VERSION);
        assertAppliedSuccessfully(CATEGORIES_MIGRATION_VERSION);
    }

    @Test
    @DisplayName("V6: estimated_amount deve ter DEFAULT 0.00 quando omitido")
    void shouldDefaultEstimatedAmountToZeroWhenOmitted() {
        String userId = insertUser();
        String categoryId = insertCategory("Categoria do default " + UUID.randomUUID());
        String projectId = insertProject(userId);
        String budgetId = UUID.randomUUID().toString();

        jdbcTemplate.update("""
                INSERT INTO budgets (id, user_id, category_id, project_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, NOW(), NOW())
                """, budgetId, userId, categoryId, projectId);

        assertThat(jdbcTemplate.queryForObject(
                "SELECT estimated_amount FROM budgets WHERE id = ?", BigDecimal.class, budgetId))
                .as("Orcamento sem valor explicito deve nascer zerado, nunca NULL")
                .isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("V6: estimated_amount deve recusar NULL")
    void shouldRejectNullEstimatedAmount() {
        String userId = insertUser();
        String categoryId = insertCategory("Categoria do nulo " + UUID.randomUUID());
        String projectId = insertProject(userId);

        assertThatThrownBy(() -> jdbcTemplate.update("""
                        INSERT INTO budgets (id, user_id, category_id, project_id, estimated_amount, created_at, updated_at)
                        VALUES (?, ?, ?, ?, NULL, NOW(), NOW())
                        """, UUID.randomUUID().toString(), userId, categoryId, projectId))
                .as("estimated_amount deve ser NOT NULL depois da V6")
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("estimated_amount");
    }

    @Test
    @DisplayName("V6: estimated_amount deve recusar valor negativo pelo CHECK nomeado")
    void shouldRejectNegativeEstimatedAmount() {
        String userId = insertUser();
        String categoryId = insertCategory("Categoria do negativo " + UUID.randomUUID());
        String projectId = insertProject(userId);

        assertThatThrownBy(() -> jdbcTemplate.update("""
                        INSERT INTO budgets (id, user_id, category_id, project_id, estimated_amount, created_at, updated_at)
                        VALUES (?, ?, ?, ?, -1.00, NOW(), NOW())
                        """, UUID.randomUUID().toString(), userId, categoryId, projectId))
                .as("Zero e permitido por causa do zeramento (CA4), negativo nao")
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining(NON_NEGATIVE_CONSTRAINT_NAME);
    }

    @Test
    @DisplayName("V6: deve barrar segundo orcamento ativo para o mesmo par obra/categoria")
    void shouldBlockDuplicateActiveBudget() {
        String userId = insertUser();
        String categoryId = insertCategory("Categoria unica " + UUID.randomUUID());
        String projectId = insertProject(userId);
        insertBudget(userId, categoryId, projectId, "1000.00");

        assertThatThrownBy(() -> insertBudget(userId, categoryId, projectId, "2000.00"))
                .as("O indice unico parcial deve proteger a RN08 no proprio banco")
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining(UNIQUE_INDEX_NAME);
    }

    @Test
    @DisplayName("V6: deve permitir novo orcamento ativo apos o soft delete do anterior")
    void shouldAllowNewActiveBudgetAfterSoftDelete() {
        String userId = insertUser();
        String categoryId = insertCategory("Categoria reutilizada " + UUID.randomUUID());
        String projectId = insertProject(userId);
        String firstBudgetId = insertBudget(userId, categoryId, projectId, "1000.00");

        jdbcTemplate.update("UPDATE budgets SET deleted_at = NOW() WHERE id = ?", firstBudgetId);
        String secondBudgetId = insertBudget(userId, categoryId, projectId, "2000.00");

        assertThat(jdbcTemplate.queryForList("""
                        SELECT id FROM budgets
                        WHERE project_id = ? AND category_id = ? AND deleted_at IS NULL
                        """, String.class, projectId, categoryId))
                .as("O par obra/categoria passado deve poder receber um novo orcamento ativo")
                .containsExactly(secondBudgetId);
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    @DisplayName("V6: deve soft-deletar duplicatas ativas mantendo a mais recente, sem apagar linhas")
    void shouldSoftDeleteDuplicateActiveBudgetsKeepingTheMostRecent() {
        dropProbeSchema();
        try {
            migrateProbeSchema("5");

            String userId = "probe-user";
            String categoryId = "probe-category";
            String projectId = "probe-project";
            jdbcTemplate.update("""
                    INSERT INTO %s.users (id, name, email, password, user_role, created_at, updated_at)
                    VALUES (?, 'Dono da sonda', 'probe@test.local', 'senha', 'ROLE_USER', NOW(), NOW())
                    """.formatted(PROBE_SCHEMA), userId);
            jdbcTemplate.update("""
                    INSERT INTO %s.expense_categories (id, name, created_at, updated_at)
                    VALUES (?, 'Categoria da sonda', NOW(), NOW())
                    """.formatted(PROBE_SCHEMA), categoryId);
            jdbcTemplate.update("""
                    INSERT INTO %s.projects (id, user_id, name, type, status, created_at, updated_at)
                    VALUES (?, ?, 'Obra da sonda', 'NEW_CONSTRUCTION', 'IN_PROGRESS', NOW(), NOW())
                    """.formatted(PROBE_SCHEMA), projectId, userId);

            insertProbeBudget("probe-budget-oldest", userId, categoryId, projectId,
                    "2026-01-01 10:00:00", "2026-01-01 10:00:00");
            insertProbeBudget("probe-budget-middle", userId, categoryId, projectId,
                    "2026-02-01 10:00:00", "2026-02-01 10:00:00");
            insertProbeBudget("probe-budget-newest", userId, categoryId, projectId,
                    "2026-03-01 10:00:00", "2026-03-01 10:00:00");

            migrateProbeSchema(null);

            Integer totalRows = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM " + PROBE_SCHEMA + ".budgets", Integer.class);
            assertThat(totalRows)
                    .as("A limpeza de duplicatas deve ser soft delete, nunca DELETE: expenses.budget_id e NOT NULL")
                    .isEqualTo(3);

            List<String> activeIds = jdbcTemplate.queryForList("""
                    SELECT id FROM %s.budgets WHERE deleted_at IS NULL
                    """.formatted(PROBE_SCHEMA), String.class);
            assertThat(activeIds)
                    .as("Só a duplicata mais recente deve permanecer ativa")
                    .containsExactly("probe-budget-newest");
        } finally {
            dropProbeSchema();
        }
    }

    @Test
    @DisplayName("V7: deve semear as 9 categorias pre-definidas uma unica vez")
    void shouldSeedNinePredefinedCategoriesExactlyOnce() {
        for (String name : PREDEFINED_CATEGORY_NAMES) {
            Integer occurrences = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM expense_categories WHERE name = ?", Integer.class, name);
            assertThat(occurrences)
                    .as("A categoria '%s' deve existir exatamente uma vez", name)
                    .isEqualTo(1);
        }

        List<String> seededIds = jdbcTemplate.queryForList("""
                SELECT id FROM expense_categories WHERE name IN (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, String.class, PREDEFINED_CATEGORY_NAMES.toArray());
        assertThat(seededIds)
                .as("Cada categoria pre-definida deve ter id proprio")
                .doesNotHaveDuplicates()
                .allSatisfy(id -> assertThat(id).hasSize(36));

        Integer withoutTimestamps = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM expense_categories
                WHERE name IN (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  AND (created_at IS NULL OR updated_at IS NULL)
                """, Integer.class, PREDEFINED_CATEGORY_NAMES.toArray());
        assertThat(withoutTimestamps)
                .as("As categorias semeadas devem ter created_at e updated_at preenchidos")
                .isZero();
    }

    private void assertAppliedSuccessfully(String version) {
        List<MigrationInfo> applied = Arrays.stream(flyway.info().applied())
                .filter(migration -> MigrationVersion.fromVersion(version).equals(migration.getVersion()))
                .toList();

        assertThat(applied)
                .as("A migration V%s deve constar entre as migracoes aplicadas pelo Flyway", version)
                .hasSize(1);
        assertThat(applied.getFirst().getState())
                .as("A migration V%s deve ter sido aplicada com sucesso", version)
                .isEqualTo(MigrationState.SUCCESS);
    }

    private void migrateProbeSchema(String targetVersion) {
        FluentConfiguration configuration = Flyway.configure()
                .dataSource(dataSource)
                .schemas(PROBE_SCHEMA)
                .defaultSchema(PROBE_SCHEMA)
                .locations("classpath:db/migration");
        if (targetVersion != null) {
            configuration.target(MigrationVersion.fromVersion(targetVersion));
        }
        configuration.load().migrate();
    }

    private void dropProbeSchema() {
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + PROBE_SCHEMA + " CASCADE");
    }

    private void insertProbeBudget(
            String budgetId, String userId, String categoryId, String projectId,
            String createdAt, String updatedAt) {
        jdbcTemplate.update("""
                INSERT INTO %s.budgets (id, user_id, category_id, project_id, estimated_amount, created_at, updated_at)
                VALUES (?, ?, ?, ?, 1000.00, ?::timestamp, ?::timestamp)
                """.formatted(PROBE_SCHEMA), budgetId, userId, categoryId, projectId, createdAt, updatedAt);
    }

    private String insertUser() {
        String userId = UUID.randomUUID().toString();
        jdbcTemplate.update("""
                INSERT INTO users (id, name, email, password, user_role, created_at, updated_at)
                VALUES (?, 'Usuario da migration', ?, 'senha', 'ROLE_USER', NOW(), NOW())
                """, userId, "usuario.orcamento." + userId + "@test.local");
        return userId;
    }

    private String insertCategory(String name) {
        String categoryId = UUID.randomUUID().toString();
        jdbcTemplate.update("""
                INSERT INTO expense_categories (id, name, created_at, updated_at)
                VALUES (?, ?, NOW(), NOW())
                """, categoryId, name);
        return categoryId;
    }

    private String insertProject(String userId) {
        String projectId = UUID.randomUUID().toString();
        jdbcTemplate.update("""
                INSERT INTO projects (id, user_id, name, type, status, created_at, updated_at)
                VALUES (?, ?, 'Obra do orcamento', 'NEW_CONSTRUCTION', 'IN_PROGRESS', NOW(), NOW())
                """, projectId, userId);
        return projectId;
    }

    private String insertBudget(String userId, String categoryId, String projectId, String amount) {
        String budgetId = UUID.randomUUID().toString();
        jdbcTemplate.update("""
                INSERT INTO budgets (id, user_id, category_id, project_id, estimated_amount, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?::numeric, NOW(), NOW())
                """, budgetId, userId, categoryId, projectId, amount);
        return budgetId;
    }
}
