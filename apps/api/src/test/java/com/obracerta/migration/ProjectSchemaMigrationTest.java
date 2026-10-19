package com.obracerta.migration;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationState;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * CA10 — prova que o Flyway aplica a V2 contra um PostgreSQL real.
 *
 * <p>O perfil {@code test} é fixado explicitamente (o mesmo da CI, ver
 * {@code application-test.properties} e {@code .github/workflows/ci.yml}), para que
 * o teste nunca caia no banco de desenvolvimento apontado por
 * {@code application.properties} — e o {@code @Transactional} desfaz tudo que cada
 * teste escreve, de modo que a suíte não deixe lixo no banco em que rodou.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ProjectSchemaMigrationTest {

    private static final String PROJECTS_MIGRATION_VERSION = "2";

    @Autowired
    private Flyway flyway;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("CA10: Flyway deve aplicar a migration V2 criando a tabela projects, colunas project_id e FKs")
    void shouldApplyV2MigrationAndCreateProjectsSchema() throws Exception {
        // 1. Validar que a migration V2 consta como aplicada com sucesso. A assercao e
        //    sobre *esta* migration (nao sobre a versao corrente do Flyway), para que a
        //    criacao de um V3 qualquer nao quebre este teste sem relacao causal.
        List<MigrationInfo> appliedV2 = Arrays.stream(flyway.info().applied())
                .filter(migration -> MigrationVersion.fromVersion(PROJECTS_MIGRATION_VERSION)
                        .equals(migration.getVersion()))
                .toList();

        assertThat(appliedV2)
                .as("A migration V2 deve constar entre as migracoes aplicadas pelo Flyway")
                .hasSize(1);
        assertThat(appliedV2.getFirst().getState())
                .as("A migration V2 deve ter sido aplicada com sucesso")
                .isEqualTo(MigrationState.SUCCESS);

        // 2. Validar a existencia da tabela 'projects'
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();

            try (ResultSet tables = metaData.getTables(null, "public", "projects", new String[]{"TABLE"})) {
                assertThat(tables.next())
                        .as("A tabela 'projects' deve existir no schema public")
                        .isTrue();
            }

            // Validar colunas da tabela 'projects'
            Set<String> projectColumns = new HashSet<>();
            try (ResultSet columns = metaData.getColumns(null, "public", "projects", null)) {
                while (columns.next()) {
                    projectColumns.add(columns.getString("COLUMN_NAME").toLowerCase());
                }
            }
            assertThat(projectColumns).contains(
                    "id", "user_id", "name", "type", "location", "status",
                    "created_at", "updated_at", "deleted_at"
            );

            // 3. Validar presenca da coluna 'project_id' em 'budgets'
            Set<String> budgetColumns = new HashSet<>();
            try (ResultSet columns = metaData.getColumns(null, "public", "budgets", null)) {
                while (columns.next()) {
                    budgetColumns.add(columns.getString("COLUMN_NAME").toLowerCase());
                }
            }
            assertThat(budgetColumns)
                    .as("A tabela 'budgets' deve conter a coluna 'project_id'")
                    .contains("project_id");

            // 4. Validar presenca da coluna 'project_id' em 'expenses'
            Set<String> expenseColumns = new HashSet<>();
            try (ResultSet columns = metaData.getColumns(null, "public", "expenses", null)) {
                while (columns.next()) {
                    expenseColumns.add(columns.getString("COLUMN_NAME").toLowerCase());
                }
            }
            assertThat(expenseColumns)
                    .as("A tabela 'expenses' deve conter a coluna 'project_id'")
                    .contains("project_id");
        }

        // 5. Validar existencia das constraints de Foreign Key no PostgreSQL
        String fkQuery = """
                SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                  AND tc.table_schema = 'public'
                  AND tc.table_name IN ('projects', 'budgets', 'expenses')
                """;

        var foreignKeys = jdbcTemplate.query(fkQuery, (rs, rowNum) -> new Object() {
            String tableName = rs.getString("table_name");
            String columnName = rs.getString("column_name");
            String foreignTableName = rs.getString("foreign_table_name");
        });

        assertThat(foreignKeys)
                .as("Deve existir FK projects.user_id -> users")
                .anyMatch(fk -> "projects".equalsIgnoreCase(fk.tableName)
                        && "user_id".equalsIgnoreCase(fk.columnName)
                        && "users".equalsIgnoreCase(fk.foreignTableName));

        assertThat(foreignKeys)
                .as("Deve existir FK budgets.project_id -> projects")
                .anyMatch(fk -> "budgets".equalsIgnoreCase(fk.tableName)
                        && "project_id".equalsIgnoreCase(fk.columnName)
                        && "projects".equalsIgnoreCase(fk.foreignTableName));

        assertThat(foreignKeys)
                .as("Deve existir FK expenses.project_id -> projects")
                .anyMatch(fk -> "expenses".equalsIgnoreCase(fk.tableName)
                        && "project_id".equalsIgnoreCase(fk.columnName)
                        && "projects".equalsIgnoreCase(fk.foreignTableName));

        // 6. Validar presenca do indice idx_projects_user_active
        String indexQuery = """
                SELECT indexname FROM pg_indexes
                WHERE schemaname = 'public' AND tablename = 'projects'
                """;
        var indexes = jdbcTemplate.queryForList(indexQuery, String.class);
        assertThat(indexes)
                .as("Indice idx_projects_user_active deve existir na tabela projects")
                .contains("idx_projects_user_active");
    }

    @Test
    @DisplayName("CA10: Deve barrar insercao de project com user_id inexistente respeitando a integridade referencial")
    void shouldEnforceForeignKeyIntegrityOnProjects() {
        String nonExistentUserId = UUID.randomUUID().toString();
        String projectId = UUID.randomUUID().toString();

        String insertProjectSql = """
                INSERT INTO projects (id, user_id, name, type, status, created_at, updated_at)
                VALUES (?, ?, 'Obra Teste', 'NEW_CONSTRUCTION', 'IN_PROGRESS', NOW(), NOW())
                """;

        assertThatThrownBy(() -> jdbcTemplate.update(insertProjectSql, projectId, nonExistentUserId))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("fk_projects_user");
    }

    @Test
    @DisplayName("CA10: Deve barrar insercao de budget com project_id inexistente respeitando a integridade referencial")
    void shouldEnforceForeignKeyIntegrityOnBudgets() {
        String userId = insertUser();
        String categoryId = insertCategory();
        String budgetId = UUID.randomUUID().toString();
        String nonExistentProjectId = UUID.randomUUID().toString();

        String insertBudgetSql = """
                INSERT INTO budgets (id, user_id, category_id, project_id, estimated_amount, created_at, updated_at)
                VALUES (?, ?, ?, ?, 1000.00, NOW(), NOW())
                """;

        assertThatThrownBy(() -> jdbcTemplate.update(insertBudgetSql, budgetId, userId, categoryId, nonExistentProjectId))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("fk_budgets_project");
    }

    @Test
    @DisplayName("CA10: Deve barrar insercao de budget sem project_id (coluna NOT NULL)")
    void shouldRejectBudgetWithoutProjectId() {
        String userId = insertUser();
        String categoryId = insertCategory();

        String insertBudgetSql = """
                INSERT INTO budgets (id, user_id, category_id, estimated_amount, created_at, updated_at)
                VALUES (?, ?, ?, 1000.00, NOW(), NOW())
                """;

        assertThatThrownBy(() -> jdbcTemplate.update(insertBudgetSql, UUID.randomUUID().toString(), userId, categoryId))
                .as("Um orcamento sem obra deve ser recusado pelo banco (project_id NOT NULL)")
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("project_id");
    }

    @Test
    @DisplayName("CA10: Deve barrar insercao de expense sem project_id (coluna NOT NULL)")
    void shouldRejectExpenseWithoutProjectId() {
        String userId = insertUser();
        String categoryId = insertCategory();
        String projectId = insertProject(userId);
        String budgetId = insertBudget(userId, categoryId, projectId);
        String supplierId = insertSupplier();

        String insertExpenseSql = """
                INSERT INTO expenses (id, budget_id, user_id, category_id, supplier_id, type, description,
                                      total_price, purchase_date, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 'MATERIAL', 'Despesa de teste da migration', 100.00, CURRENT_DATE, NOW(), NOW())
                """;

        assertThatThrownBy(() -> jdbcTemplate.update(insertExpenseSql,
                        UUID.randomUUID().toString(), budgetId, userId, categoryId, supplierId))
                .as("Uma despesa sem obra deve ser recusada pelo banco (project_id NOT NULL)")
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("project_id");
    }

    private String insertUser() {
        String userId = UUID.randomUUID().toString();
        jdbcTemplate.update("""
                INSERT INTO users (id, name, email, password, user_role, created_at, updated_at)
                VALUES (?, 'Usuario da migration', ?, 'senha', 'ROLE_USER', NOW(), NOW())
                """, userId, "usuario.migration." + userId + "@test.local");
        return userId;
    }

    private String insertCategory() {
        String categoryId = UUID.randomUUID().toString();
        jdbcTemplate.update("""
                INSERT INTO expense_categories (id, name, created_at, updated_at)
                VALUES (?, ?, NOW(), NOW())
                """, categoryId, "Categoria da migration " + categoryId);
        return categoryId;
    }

    private String insertProject(String userId) {
        String projectId = UUID.randomUUID().toString();
        jdbcTemplate.update("""
                INSERT INTO projects (id, user_id, name, type, status, created_at, updated_at)
                VALUES (?, ?, 'Obra da migration', 'NEW_CONSTRUCTION', 'IN_PROGRESS', NOW(), NOW())
                """, projectId, userId);
        return projectId;
    }

    private String insertBudget(String userId, String categoryId, String projectId) {
        String budgetId = UUID.randomUUID().toString();
        jdbcTemplate.update("""
                INSERT INTO budgets (id, user_id, category_id, project_id, estimated_amount, created_at, updated_at)
                VALUES (?, ?, ?, ?, 1000.00, NOW(), NOW())
                """, budgetId, userId, categoryId, projectId);
        return budgetId;
    }

    private String insertSupplier() {
        String supplierId = UUID.randomUUID().toString();
        jdbcTemplate.update("""
                INSERT INTO suppliers (id, name, created_at, updated_at)
                VALUES (?, 'Fornecedor da migration', NOW(), NOW())
                """, supplierId);
        return supplierId;
    }
}
