package com.obracerta.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import javax.sql.DataSource;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest @ActiveProfiles("test")
class ExpenseRegistrationMigrationTest {
    @Autowired DataSource dataSource;
    @Test void splitsSharedLegacySuppliersByOwnerPreservingUnreferencedSuppliers() {
        var jdbc = new JdbcTemplate(dataSource);
        String schema = "expense_owner_probe";
        jdbc.execute("DROP SCHEMA IF EXISTS "+schema+" CASCADE");
        try {
            Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema)
                    .target("7").load().migrate();
            for (String owner : java.util.List.of("a","b")) {
                jdbc.update("INSERT INTO "+schema+".users VALUES (?,? ,?,'password','USER',now(),now())",owner,owner,owner+"@test");
                jdbc.update("INSERT INTO "+schema+".projects(id,user_id,name,type,status,created_at,updated_at) VALUES (?,?,'Casa','RENOVATION','IN_PROGRESS',now(),now())","p"+owner,owner);
            }
            String category = jdbc.queryForObject("SELECT id FROM "+schema+".expense_categories LIMIT 1",String.class);
            jdbc.update("INSERT INTO "+schema+".suppliers(id,name,document) VALUES ('shared','Loja','12.345.678/0001-90'),('unused','Sem dono',null),('single','Exclusivo','00000000000000')");
            for (String owner : java.util.List.of("a","b")) {
                jdbc.update("INSERT INTO "+schema+".budgets(id,user_id,project_id,category_id,estimated_amount) VALUES (?,?,?, ?,0)","b"+owner,owner,"p"+owner,category);
                jdbc.update("INSERT INTO "+schema+".expenses(id,user_id,project_id,budget_id,category_id,supplier_id,total_price) VALUES (?,?,?,?,?,'shared',1)","e"+owner,owner,"p"+owner,"b"+owner,category);
            }
            jdbc.update("INSERT INTO "+schema+".expenses(id,user_id,project_id,budget_id,category_id,supplier_id,total_price) VALUES ('single-e','a','pa','ba',?,'single',1)",category);
            jdbc.update("INSERT INTO "+schema+".pending_payments(id,expense_id) VALUES ('payment','eb')");
            jdbc.update("UPDATE "+schema+".expenses SET receipt_url='https://legacy.invalid/receipt.pdf' WHERE id='ea'");
            Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema).load().migrate();
            assertThat(jdbc.queryForObject("SELECT receipt_url FROM "+schema+".expenses WHERE id='ea'",String.class))
                    .isEqualTo("https://legacy.invalid/receipt.pdf");
            assertThat(jdbc.queryForObject("SELECT receipt_state FROM "+schema+".expenses WHERE id='ea'",String.class)).isEqualTo("NONE");
            assertThat(jdbc.queryForObject("SELECT receipt_key FROM "+schema+".expenses WHERE id='ea'",String.class)).isNull();
            assertThat(jdbc.queryForObject("SELECT count(*) FROM "+schema+".expenses e JOIN "+schema+".suppliers s ON s.id=e.supplier_id WHERE s.user_id=e.user_id",Integer.class)).isEqualTo(3);
            assertThat(jdbc.queryForObject("SELECT count(DISTINCT supplier_id) FROM "+schema+".expenses WHERE id IN ('ea','eb')",Integer.class)).isEqualTo(2);
            assertThat(jdbc.queryForObject("SELECT user_id FROM "+schema+".suppliers WHERE id='unused'",String.class)).isNull();
            assertThat(jdbc.queryForObject("SELECT user_id FROM "+schema+".suppliers WHERE id='single'",String.class)).isEqualTo("a");
            assertThat(jdbc.queryForObject("SELECT paid FROM "+schema+".expenses WHERE id='ea'",Boolean.class)).isTrue();
            assertThat(jdbc.queryForObject("SELECT paid FROM "+schema+".expenses WHERE id='eb'",Boolean.class)).isFalse();
            assertThat(jdbc.queryForObject("SELECT is_nullable FROM information_schema.columns WHERE table_schema=? AND table_name='expenses' AND column_name='budget_id'",String.class,schema)).isEqualTo("YES");
        } finally { jdbc.execute("DROP SCHEMA IF EXISTS "+schema+" CASCADE"); }
    }
}
