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
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import javax.sql.DataSource;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;

// No test transaction: each HTTP request must finish its own commit.
@SpringBootTest @ActiveProfiles("test") @AutoConfigureMockMvc(addFilters=false)
class ExpenseReceiptReplacementIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired DataSource dataSource;
    @Autowired UserRepository users;
    @Autowired ProjectRepository projects;
    @Autowired ExpenseCategoryRepository categories;
    @MockBean UserContextHelper identity;
    @MockBean ReceiptStorage storage;
    User owner, other;
    Project project;
    String id, oldKey, uploadedKey, trigger;
    boolean uploadFails, deletionFails;
    final Map<String,byte[]> objects=new HashMap<>();
    final List<String> deleted=new ArrayList<>();
    Map<String,Object> financial, payment;

    @BeforeEach void setup() throws Exception {
        owner=user(); other=user(); when(identity.getAuthenticatedUser()).thenReturn(owner);
        project=projects.saveAndFlush(Project.builder().user(owner).name("Casa").type(ProjectType.RENOVATION)
                .status(ProjectStatus.IN_PROGRESS).build());
        var body=json.createObjectNode().put("projectId",project.getId())
                .put("categoryId",categories.findAll().getFirst().getId()).put("description","Cimento")
                .put("purchaseDate","2030-01-01").put("paid",false).put("dueDate","2030-01-02")
                .put("valueMode","DIRECT").put("totalPrice",100.25).put("receiptExpected",true);
        body.putObject("newSupplier").put("name","Loja");
        var response=mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body.toString()))
                .andExpect(status().isCreated()).andReturn().getResponse();
        id=json.readTree(response.getContentAsString()).get("id").asText(); oldKey="expenses/"+id+"/old.pdf";
        jdbc.update("update expenses set receipt_state='UPLOADED',receipt_key=?,receipt_content_type='application/pdf',receipt_size=3 where id=?",oldKey,id);
        objects.put(oldKey,"old".getBytes()); financial=financial();
        payment=jdbc.queryForMap("select * from pending_payments where expense_id=?",id);
        doAnswer(invocation -> {
            uploadedKey=invocation.getArgument(0);
            assertThat(uploadedKey).isNotEqualTo(oldKey);
            assertThat(committedKey()).isEqualTo(oldKey); // Association cannot precede confirmed upload.
            if (uploadFails) throw failure();
            objects.put(uploadedKey,invocation.<InputStream>getArgument(1).readAllBytes()); return null;
        }).when(storage).put(anyString(),any(),anyLong(),anyString());
        doAnswer(invocation -> {
            String key=invocation.getArgument(0); deleted.add(key);
            assertThat(key).isNotEqualTo(committedKey()); // Independent connection sees the committed association.
            if (deletionFails) throw failure();
            objects.remove(key); return null;
        }).when(storage).delete(anyString());
        when(storage.get(anyString())).thenAnswer(invocation -> new ByteArrayInputStream(objects.get(invocation.getArgument(0))));
        clearInvocations(storage);
    }
    User user() { return users.saveAndFlush(User.builder().name("Dono").email(UUID.randomUUID()+"@test.local")
            .password("test").userRole(UserRole.USER).build()); }
    ReceiptException failure() { return new ReceiptException(HttpStatus.SERVICE_UNAVAILABLE,"Armazenamento indisponível"); }
    String endpoint() { return "/api/expenses/"+id+"/receipt"; }
    ResultActions replace(String filename,String type,byte[] bytes) throws Exception {
        return mvc.perform(multipart(endpoint()).file(new MockMultipartFile("file",filename,type,bytes))
                .with(request -> {request.setMethod("PUT"); return request;}));
    }
    ResultActions replace() throws Exception { return replace("new.png","image/png","new".getBytes()); }
    String committedKey() throws Exception {
        // Do not use transaction-aware JdbcTemplate here: it could observe an uncommitted update.
        try (var connection=dataSource.getConnection(); var query=connection.prepareStatement("select receipt_key from expenses where id=?")) {
            query.setString(1,id); try (var result=query.executeQuery()) { assertThat(result.next()).isTrue(); return result.getString(1); }
        }
    }
    Map<String,Object> financial() {
        return jdbc.queryForMap("select id,project_id,user_id,category_id,supplier_id,budget_id,description,purchase_date,paid,quantity,unit_price,total_price,deleted_at from expenses where id=?",id);
    }
    void assertFinances() {
        assertThat(financial()).isEqualTo(financial);
        assertThat(jdbc.queryForMap("select * from pending_payments where expense_id=?",id)).isEqualTo(payment);
    }
    void assertOldPreserved() throws Exception {
        assertThat(committedKey()).isEqualTo(oldKey); assertThat(objects.get(oldKey)).isEqualTo("old".getBytes());
        mvc.perform(get(endpoint())).andExpect(status().isOk()).andExpect(content().bytes("old".getBytes())); assertFinances();
    }
    @ParameterizedTest @CsvSource({"jpg,image/jpeg","png,image/png","pdf,application/pdf"})
    void replacementCommitsBeforeDeletingOldAndOnlyNewIsDownloadable(String extension,String type) throws Exception {
        replace("new."+extension,type,"new".getBytes()).andExpect(status().isOk())
                .andExpect(jsonPath("$.receiptState").value("UPLOADED"))
                .andExpect(jsonPath("$.receiptDeletionFailed").value(false)).andExpect(jsonPath("$.receiptKey").doesNotExist());
        assertThat(committedKey()).isEqualTo(uploadedKey); assertThat(deleted).containsExactly(oldKey);
        assertThat(objects).containsOnlyKeys(uploadedKey);
        mvc.perform(get(endpoint())).andExpect(content().bytes("new".getBytes())).andExpect(content().contentType(type));
        verify(storage,times(1)).delete(oldKey); assertFinances();
    }
    @Test void sequenceUsesDistinctKeysAndNeverDeletesCurrentObject() throws Exception {
        Set<String> keys=new HashSet<>(); keys.add(oldKey);
        for (int attempt=0;attempt<3;attempt++) {
            replace().andExpect(status().isOk()); assertThat(keys.add(uploadedKey)).isTrue();
            assertThat(objects).containsOnlyKeys(uploadedKey); oldKey=uploadedKey;
        }
        assertThat(deleted).hasSize(3).doesNotContain(uploadedKey); assertFinances();
    }
    @Test void failedUploadPreservesConfirmedReceiptWithoutDeletingAnything() throws Exception {
        uploadFails=true; replace().andExpect(status().isServiceUnavailable());
        verify(storage,never()).delete(anyString()); assertOldPreserved();
        mvc.perform(get("/api/expenses/"+id)).andExpect(jsonPath("$.receiptState").value("UPLOADED"));
    }
    @Test void failedOldDeletionKeepsNewAndReportsOnlyImmediateFailure() throws Exception {
        deletionFails=true; replace().andExpect(status().isOk()).andExpect(jsonPath("$.receiptDeletionFailed").value(true));
        assertThat(committedKey()).isEqualTo(uploadedKey); assertThat(deleted).containsExactly(oldKey);
        mvc.perform(get(endpoint())).andExpect(content().bytes("new".getBytes()));
        mvc.perform(get("/api/expenses/"+id)).andExpect(jsonPath("$.receiptDeletionFailed").value(false));
        verify(storage,times(1)).delete(oldKey); assertFinances();
    }
    @ParameterizedTest @ValueSource(booleans={false,true})
    void failedAssociationPreservesOldAndAttemptsDeletingNewOnce(boolean orphanDeletionFails) throws Exception {
        deletionFails=orphanDeletionFails;
        trigger="replacement_failure_"+UUID.randomUUID().toString().replace("-","");
        jdbc.execute("create function "+trigger+"() returns trigger language plpgsql as $$ begin if NEW.id='"+id
                +"' and NEW.receipt_key is distinct from OLD.receipt_key then raise exception 'simulated replacement failure'; end if; return NEW; end $$");
        jdbc.execute("create trigger "+trigger+" before update on expenses for each row execute function "+trigger+"()");
        try {
            var result=replace().andExpect(status().isServiceUnavailable()).andExpect(jsonPath("$.message").value(
                    org.hamcrest.Matchers.containsString("não foi confirmada")));
            if (orphanDeletionFails) result.andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("não pôde ser apagado")));
            assertThat(deleted).containsExactly(uploadedKey); verify(storage,times(1)).delete(uploadedKey);
            assertThat(objects.containsKey(uploadedKey)).isEqualTo(orphanDeletionFails); assertOldPreserved();
        } finally { dropTrigger(); }
    }
    @ParameterizedTest @CsvSource({"x.txt,text/plain,text","x.pdf,image/png,text","x.jpg,application/pdf,text",
            "x.gif,image/gif,text","x.pdf,,text","x.pdf,application/pdf,empty","x.pdf,application/pdf,large"})
    void invalidFileDoesNotTouchStorageOrConfirmedReceipt(String filename,String type,String content) throws Exception {
        byte[] bytes=content.equals("empty") ? new byte[0] : content.equals("large") ? new byte[10485761] : "text".getBytes();
        replace(filename,type,bytes).andExpect(status().is(content.equals("large") ? 413 : 400));
        verifyNoInteractions(storage); assertOldPreserved();
    }
    @Test void acceptsExactlyTenMebibytesForReplacement() throws Exception {
        byte[] bytes=new byte[10485760]; replace("new.pdf","application/pdf",bytes).andExpect(status().isOk());
        mvc.perform(get(endpoint())).andExpect(content().bytes(bytes)); assertFinances();
    }
    @ParameterizedTest @ValueSource(strings={"foreign","foreignProject","missing","expenseDeleted","projectDeleted"})
    void inaccessibleExpenseIs404BeforeStorage(String scenario) throws Exception {
        if (scenario.equals("foreign")) when(identity.getAuthenticatedUser()).thenReturn(other);
        if (scenario.equals("foreignProject")) jdbc.update("update projects set user_id=? where id=?",other.getId(),project.getId());
        if (scenario.equals("expenseDeleted")) jdbc.update("update expenses set deleted_at=now() where id=?",id);
        if (scenario.equals("projectDeleted")) jdbc.update("update projects set deleted_at=now() where id=?",project.getId());
        var before=financial(); String originalId=id;
        if (scenario.equals("missing")) id=UUID.randomUUID().toString();
        try { replace().andExpect(status().isNotFound()); verifyNoInteractions(storage); }
        finally { id=originalId; }
        assertThat(committedKey()).isEqualTo(oldKey); assertThat(financial()).isEqualTo(before);
        assertThat(jdbc.queryForMap("select * from pending_payments where expense_id=?",id)).isEqualTo(payment);
    }
    void dropTrigger() {
        if (trigger==null) return;
        jdbc.execute("drop trigger if exists "+trigger+" on expenses"); jdbc.execute("drop function if exists "+trigger+"()"); trigger=null;
    }
    @AfterEach void cleanup() {
        dropTrigger();
        if (project!=null) {
            jdbc.update("delete from pending_payments where expense_id in (select id from expenses where project_id=?)",project.getId());
            jdbc.update("delete from expenses where project_id=?",project.getId());
            jdbc.update("delete from suppliers where user_id=?",owner.getId()); projects.deleteById(project.getId());
        }
        if (owner!=null) users.deleteById(owner.getId()); if (other!=null) users.deleteById(other.getId());
    }
}
