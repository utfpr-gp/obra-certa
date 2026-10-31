package com.obracerta.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.*;
import com.obracerta.exception.ReceiptException;
import com.obracerta.integration.ReceiptStorage;
import com.obracerta.model.entity.*;
import com.obracerta.repository.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;

// Each HTTP call commits independently: rollback must not restore a physically deleted object.
@SpringBootTest @ActiveProfiles("test") @AutoConfigureMockMvc(addFilters=false)
class ExpenseReceiptRemovalIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired ProjectRepository projects;
    @Autowired ExpenseCategoryRepository categories;
    @MockBean UserContextHelper identity;
    @MockBean ReceiptStorage storage;
    User owner, other;
    Project project;
    String id, key;
    final Set<String> objects=new HashSet<>();
    final List<Boolean> absentAtDeletion=new ArrayList<>();
    boolean storageFails;
    String trigger;
    Map<String,Object> financial, payment;

    @BeforeEach void setup() throws Exception {
        owner=user(); other=user();
        when(identity.getAuthenticatedUser()).thenReturn(owner);
        project=projects.saveAndFlush(Project.builder().user(owner).name("Casa").type(ProjectType.RENOVATION)
                .status(ProjectStatus.IN_PROGRESS).build());
        var body=json.createObjectNode().put("projectId",project.getId())
                .put("categoryId",categories.findAll().getFirst().getId()).put("description","Cimento")
                .put("purchaseDate","2030-01-01").put("paid",false).put("dueDate","2030-01-02")
                .put("valueMode","DIRECT").put("totalPrice",100.25).put("receiptExpected",true);
        body.putObject("newSupplier").put("name","Loja");
        var response=mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body.toString()))
                .andExpect(status().isCreated()).andReturn().getResponse();
        id=json.readTree(response.getContentAsString()).get("id").asText();
        key="expenses/"+id+"/receipt";
        jdbc.update("update expenses set receipt_state='UPLOADED',receipt_key=?,receipt_content_type='application/pdf',receipt_size=10 where id=?",key,id);
        objects.add(key);
        financial=financial(); payment=jdbc.queryForMap("select * from pending_payments where expense_id=?",id);
        doAnswer(invocation -> {
                assertThat(invocation.<String>getArgument(0)).isEqualTo(key);
                assertUploaded();
                absentAtDeletion.add(!objects.contains(key));
                if (storageFails) throw new ReceiptException(HttpStatus.SERVICE_UNAVAILABLE,"Storage indisponível");
                objects.remove(key);
                return null;
        }).when(storage).delete(anyString());
        clearInvocations(storage);
    }
    User user() { return users.saveAndFlush(User.builder().name("Dono").email(UUID.randomUUID()+"@test.local")
            .password("test").userRole(UserRole.USER).build()); }
    Map<String,Object> financial() {
        return jdbc.queryForMap("select id,project_id,user_id,category_id,supplier_id,budget_id,description,purchase_date,paid,quantity,unit_price,total_price,deleted_at from expenses where id=?",id);
    }
    void assertFinancialPreserved() {
        assertThat(financial()).isEqualTo(financial);
        assertThat(jdbc.queryForMap("select * from pending_payments where expense_id=?",id)).isEqualTo(payment);
    }
    void assertUploaded() {
        var row=jdbc.queryForMap("select receipt_state,receipt_key,receipt_content_type,receipt_size from expenses where id=?",id);
        assertThat(row).containsEntry("receipt_state","UPLOADED").containsEntry("receipt_key",key)
                .containsEntry("receipt_content_type","application/pdf").containsEntry("receipt_size",10L);
    }
    void assertRemoved() throws Exception {
        mvc.perform(get("/api/expenses/"+id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.receiptState").value("NONE"))
                .andExpect(jsonPath("$.totalPrice").value(100.25)).andExpect(jsonPath("$.paid").value(false))
                .andExpect(jsonPath("$.dueDate").value("2030-01-02"));
        var row=jdbc.queryForMap("select receipt_state,receipt_key,receipt_content_type,receipt_size from expenses where id=?",id);
        assertThat(row).containsEntry("receipt_state","NONE").containsEntry("receipt_key",null)
                .containsEntry("receipt_content_type",null).containsEntry("receipt_size",null);
        assertFinancialPreserved();
    }
    String endpoint() { return "/api/expenses/"+id+"/receipt"; }
    @Test void removesPhysicallyBeforeClearingMetadataAndPreservesFinances() throws Exception {
        mvc.perform(delete(endpoint())).andExpect(status().isOk()).andExpect(jsonPath("$.receiptState").value("NONE"));
        assertThat(objects).isEmpty(); assertThat(absentAtDeletion).containsExactly(false);
        assertRemoved();
    }
    @Test void acceptsAlreadyAbsentObject() throws Exception {
        objects.clear();
        mvc.perform(delete(endpoint())).andExpect(status().isOk());
        assertThat(absentAtDeletion).containsExactly(true); assertRemoved();
    }
    @Test void storageFailureKeepsLinkAndAllowsOnlyManualRetry() throws Exception {
        storageFails=true;
        mvc.perform(delete(endpoint())).andExpect(status().isServiceUnavailable());
        assertUploaded(); assertFinancialPreserved();
        assertThat(objects).containsExactly(key); assertThat(absentAtDeletion).hasSize(1);
        storageFails=false;
        mvc.perform(delete(endpoint())).andExpect(status().isOk());
        assertThat(absentAtDeletion).containsExactly(false,false); assertRemoved();
    }
    @Test void databaseFailureAfterPhysicalDeletionReturnsErrorAndManualRetryCompletes() throws Exception {
        trigger="receipt_failure_"+UUID.randomUUID().toString().replace("-","");
        jdbc.execute("create function "+trigger+"() returns trigger language plpgsql as $$ begin "
                +"if NEW.id='"+id+"' and NEW.receipt_state='NONE' then raise exception 'simulated receipt persistence failure'; end if; return NEW; end $$");
        jdbc.execute("create trigger "+trigger+" before update on expenses for each row execute function "+trigger+"()");
        try {
            mvc.perform(delete(endpoint())).andExpect(status().is5xxServerError());
            assertThat(objects).isEmpty(); assertUploaded(); assertFinancialPreserved();
        } finally { dropTrigger(); }
        mvc.perform(delete(endpoint())).andExpect(status().isOk());
        assertThat(absentAtDeletion).containsExactly(false,true); assertRemoved();
    }
    @ParameterizedTest @ValueSource(strings={"foreign","missing","expenseDeleted","projectDeleted"})
    void unauthorizedOrInactiveExpenseIs404BeforeStorage(String scenario) throws Exception {
        String target=endpoint();
        if (scenario.equals("foreign")) when(identity.getAuthenticatedUser()).thenReturn(other);
        if (scenario.equals("missing")) target="/api/expenses/"+UUID.randomUUID()+"/receipt";
        if (scenario.equals("expenseDeleted")) jdbc.update("update expenses set deleted_at=now() where id=?",id);
        if (scenario.equals("projectDeleted")) jdbc.update("update projects set deleted_at=now() where id=?",project.getId());
        Map<String,Object> before=financial();
        mvc.perform(delete(target)).andExpect(status().isNotFound());
        verifyNoInteractions(storage); assertUploaded(); assertThat(objects).containsExactly(key);
        assertThat(financial()).isEqualTo(before);
        assertThat(jdbc.queryForMap("select * from pending_payments where expense_id=?",id)).isEqualTo(payment);
    }
    @ParameterizedTest @ValueSource(strings={"NONE","PENDING"})
    void noConfirmedReceiptReturnsCurrentStateWithoutStorage(String state) throws Exception {
        jdbc.update("update expenses set receipt_state=?,receipt_key=null,receipt_content_type=null,receipt_size=null where id=?",state,id);
        mvc.perform(delete(endpoint())).andExpect(status().isOk()).andExpect(jsonPath("$.receiptState").value(state));
        verifyNoInteractions(storage); assertFinancialPreserved();
    }
    void dropTrigger() {
        if (trigger==null) return;
        jdbc.execute("drop trigger if exists "+trigger+" on expenses");
        jdbc.execute("drop function if exists "+trigger+"()"); trigger=null;
    }
    @AfterEach void cleanup() {
        dropTrigger();
        if (project!=null) {
            jdbc.update("delete from pending_payments where expense_id in (select id from expenses where project_id=?)",project.getId());
            jdbc.update("delete from expenses where project_id=?",project.getId());
            jdbc.update("delete from suppliers where user_id=?",owner.getId());
            projects.deleteById(project.getId());
        }
        if (owner!=null) users.deleteById(owner.getId());
        if (other!=null) users.deleteById(other.getId());
    }
}
