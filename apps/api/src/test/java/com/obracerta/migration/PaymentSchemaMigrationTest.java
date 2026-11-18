package com.obracerta.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.dao.DataIntegrityViolationException;

import javax.sql.DataSource;
import java.sql.SQLException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class PaymentSchemaMigrationTest {

    @Autowired
    private DataSource dataSource;

    @Test
    void backfillsPaymentStatusWithoutInventingPaidAtAndValidatesSchema() {
        var jdbc = new JdbcTemplate(dataSource);
        String schema = "payment_schema_probe";
        jdbc.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
        try {
            Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema)
                    .target("9").load().migrate();

            jdbc.update("INSERT INTO " + schema + ".users VALUES ('u1', 'Dono', 'dono@test.local', 'password', 'USER', now(), now())");
            jdbc.update("INSERT INTO " + schema + ".projects(id, user_id, name, type, status, created_at, updated_at) VALUES ('p1', 'u1', 'Casa', 'RENOVATION', 'IN_PROGRESS', now(), now())");
            String category = jdbc.queryForObject("SELECT id FROM " + schema + ".expense_categories LIMIT 1", String.class);
            jdbc.update("INSERT INTO " + schema + ".suppliers(id, user_id, name) VALUES ('s1', 'u1', 'Loja')");

            // Despesa paga legada vinculada a pending_payments
            jdbc.update("INSERT INTO " + schema + ".expenses(id, user_id, project_id, category_id, supplier_id, total_price, paid, description, purchase_date) VALUES ('e_paid', 'u1', 'p1', ?, 's1', 100, true, 'Despesa paga', '2030-01-01')", category);
            jdbc.update("INSERT INTO " + schema + ".pending_payments(id, expense_id, due_date) VALUES ('pay_paid', 'e_paid', '2030-01-05')");

            // Despesa pendente vinculada a pending_payments
            jdbc.update("INSERT INTO " + schema + ".expenses(id, user_id, project_id, category_id, supplier_id, total_price, paid, description, purchase_date) VALUES ('e_pending', 'u1', 'p1', ?, 's1', 200, false, 'Despesa pendente', '2030-01-01')", category);
            jdbc.update("INSERT INTO " + schema + ".pending_payments(id, expense_id, due_date) VALUES ('pay_pending', 'e_pending', '2030-01-10')");

            // Executa migration V10
            Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema).target("10").load().migrate();

            // Prova backfill do status sem inventar data de quitação (paid_at permanece null no legado)
            String paidStatus = jdbc.queryForObject("SELECT status FROM " + schema + ".pending_payments WHERE id = 'pay_paid'", String.class);
            String paidAtPaid = jdbc.queryForObject("SELECT paid_at FROM " + schema + ".pending_payments WHERE id = 'pay_paid'", String.class);
            assertThat(paidStatus).isEqualTo("PAID");
            assertThat(paidAtPaid).isNull();

            String pendingStatus = jdbc.queryForObject("SELECT status FROM " + schema + ".pending_payments WHERE id = 'pay_pending'", String.class);
            String paidAtPending = jdbc.queryForObject("SELECT paid_at FROM " + schema + ".pending_payments WHERE id = 'pay_pending'", String.class);
            assertThat(pendingStatus).isEqualTo("PENDING");
            assertThat(paidAtPending).isNull();

            // Isola o CHECK de status: despesa sem pagamento e vencimento válido.
            jdbc.update("INSERT INTO " + schema + ".expenses(id, user_id, project_id, category_id, supplier_id, total_price, paid, description, purchase_date) VALUES ('e_invalid_status', 'u1', 'p1', ?, 's1', 100, false, 'Teste status', '2030-01-01')", category);
            assertThatThrownBy(() -> jdbc.update("INSERT INTO " + schema + ".pending_payments(id, expense_id, due_date, status) VALUES ('invalid', 'e_invalid_status', '2030-01-05', 'INVALID')"))
                    .isInstanceOf(DataIntegrityViolationException.class)
                    .rootCause()
                    .isInstanceOf(SQLException.class)
                    .hasMessageContaining("chk_pending_payments_status")
                    .satisfies(cause -> assertThat(((SQLException) cause).getSQLState()).isEqualTo("23514"));
        } finally {
            jdbc.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
        }
    }
}
