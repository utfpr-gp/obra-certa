package com.obracerta.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.*;
import com.obracerta.model.entity.*;
import com.obracerta.repository.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;

@SpringBootTest @ActiveProfiles("test") @AutoConfigureMockMvc(addFilters=false)
@Transactional
class ExpenseReceiptIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired ProjectRepository projects;
    @Autowired ExpenseCategoryRepository categories;
    @Autowired ExpenseRepository expenses;
    @Autowired SupplierRepository suppliers;
    @Autowired BudgetRepository budgets;
    @Autowired JdbcTemplate jdbc;
    @MockBean UserContextHelper identity;
    @MockBean com.obracerta.integration.ReceiptStorage storage;
    final java.util.Map<String,byte[]> objects=new java.util.HashMap<>();
    User owner, other;
    Project project;
    String categoryId;
    @BeforeEach void setup() {
        objects.clear();
        org.mockito.Mockito.doAnswer(invocation -> {
            objects.put(invocation.getArgument(0), ((java.io.InputStream)invocation.getArgument(1)).readAllBytes());
            return null;
        }).when(storage).put(org.mockito.ArgumentMatchers.anyString(),org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.anyLong(),org.mockito.ArgumentMatchers.anyString());
        org.mockito.Mockito.when(storage.get(org.mockito.ArgumentMatchers.anyString())).thenAnswer(invocation ->
                new java.io.ByteArrayInputStream(objects.get(invocation.getArgument(0))));
        owner = user(); other = user();
        when(identity.getAuthenticatedUser()).thenReturn(owner);
        project = projects.saveAndFlush(Project.builder().user(owner).name("Casa").type(ProjectType.RENOVATION)
                .status(ProjectStatus.IN_PROGRESS).build());
        categoryId = categories.findAll().getFirst().getId();
    }
    User user() { return users.saveAndFlush(User.builder().name("Dono").email(UUID.randomUUID()+"@test.local")
            .password("test").userRole(UserRole.USER).build()); }
    ObjectNode body() {
        var body = json.createObjectNode().put("projectId",project.getId()).put("categoryId",categoryId)
                .put("description","Cimento").put("purchaseDate","2030-01-01").put("paid",true)
                .put("valueMode","DIRECT").put("totalPrice",100.25);
        body.putObject("newSupplier").put("name","Loja").put("document","12.345.678/0001-90");
        return body;
    }
    String create(ObjectNode body) throws Exception {
        var response = mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body.toString()))
                .andExpect(status().isCreated()).andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.paid").value(true)).andReturn().getResponse();
        String id = json.readTree(response.getContentAsString()).get("id").asText();
        assertThat(response.getHeader("Location")).isEqualTo("/api/expenses/"+id);
        return id;
    }
    @ParameterizedTest
    @CsvSource({"jpg,image/jpeg", "png,image/png", "pdf,application/pdf"})
    void uploadsAndReadsPrivateReceipt(String extension, String type) throws Exception {
        String id=create(body().put("receiptExpected",true));
        mvc.perform(get("/api/expenses/"+id)).andExpect(jsonPath("$.receiptState").value("PENDING"));
        byte[] bytes="receipt bytes".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        var file=new org.springframework.mock.web.MockMultipartFile("file","../../receipt."+extension,type,bytes);
        mvc.perform(multipart("/api/expenses/"+id+"/receipt").file(file).with(r -> {r.setMethod("PUT"); return r;}))
                .andExpect(status().isOk()).andExpect(jsonPath("$.receiptState").value("UPLOADED"))
                .andExpect(jsonPath("$.receiptKey").doesNotExist());
        mvc.perform(get("/api/expenses/"+id+"/receipt")).andExpect(status().isOk())
                .andExpect(content().bytes(bytes)).andExpect(content().contentType(type))
                .andExpect(header().string("Content-Disposition",org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("../"))));
    }

    @ParameterizedTest
    @CsvSource({"receipt.txt,text/plain,text", "receipt.pdf,image/png,text", "receipt.png,application/pdf,text",
            "receipt.jpg,image/png,text", "receipt.gif,image/gif,text", "receipt.pdf,,text",
            "receipt.pdf,application/pdf,empty", "receipt.pdf,application/pdf,large"})
    void rejectsInvalidReceiptWithoutStorageOrFinancialChanges(String filename, String type, String content) throws Exception {
        var request=body().put("receiptExpected",true).put("paid",false).put("dueDate","2030-01-02");
        var response=mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(request.toString()))
                .andExpect(status().isCreated()).andReturn().getResponse();
        String id=json.readTree(response.getContentAsString()).get("id").asText();
        byte[] bytes=switch(content) {
            case "empty" -> new byte[0];
            case "large" -> new byte[10485761];
            default -> "not a receipt".getBytes();
        };
        org.mockito.Mockito.clearInvocations(storage);
        mvc.perform(multipart("/api/expenses/"+id+"/receipt").file(new org.springframework.mock.web.MockMultipartFile(
                "file",filename,type,bytes)).with(r -> {r.setMethod("PUT"); return r;}))
                .andExpect(status().is(content.equals("large") ? 413 : 400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("JPEG, PNG ou PDF")))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("10 MB")));
        org.mockito.Mockito.verifyNoInteractions(storage);
        assertThat(objects).isEmpty();
        mvc.perform(get("/api/expenses/"+id)).andExpect(jsonPath("$.receiptState").value("PENDING"))
                .andExpect(jsonPath("$.paid").value(false)).andExpect(jsonPath("$.totalPrice").value(100.25))
                .andExpect(jsonPath("$.dueDate").value("2030-01-02"));
        assertThat(jdbc.queryForObject("select count(*) from pending_payments where expense_id=?",Long.class,id)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select receipt_key from expenses where id=?",String.class,id)).isNull();
    }
    @ParameterizedTest
    @CsvSource({"receipt.jpg,image/jpeg", "receipt.JPEG,IMAGE/JPEG", "receipt.PNG,image/png", "receipt.PDF,application/pdf"})
    void acceptsDeclaredTypeAndSizeWithoutInspectingContent(String filename, String type) throws Exception {
        String id=create(body().put("receiptExpected",true));
        byte[] bytes="arbitrary bytes without a file signature".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        mvc.perform(multipart("/api/expenses/"+id+"/receipt").file(new org.springframework.mock.web.MockMultipartFile(
                "file",filename,type,bytes)).with(r -> {r.setMethod("PUT"); return r;}))
                .andExpect(status().isOk()).andExpect(jsonPath("$.receiptState").value("UPLOADED"));
        assertThat(objects.values()).singleElement().isEqualTo(bytes);
    }
    @Test void acceptsExactlyTenMebibytes() throws Exception {
        String id=create(body().put("receiptExpected",true));
        byte[] bytes=new byte[10485760];
        mvc.perform(multipart("/api/expenses/"+id+"/receipt").file(new org.springframework.mock.web.MockMultipartFile(
                "file","receipt.pdf","application/pdf",bytes)).with(r -> {r.setMethod("PUT"); return r;}))
                .andExpect(status().isOk());
        mvc.perform(get("/api/expenses/"+id+"/receipt")).andExpect(content().bytes(bytes));
    }
    @ParameterizedTest @ValueSource(strings={"other", "expenseDeleted", "projectDeleted"})
    void deniesReadAndUploadBeforeAnyStorageAccess(String scenario) throws Exception {
        String id=create(body().put("receiptExpected",true));
        expenses.flush();
        if (scenario.equals("other")) when(identity.getAuthenticatedUser()).thenReturn(other);
        else if (scenario.equals("expenseDeleted")) assertThat(jdbc.update("update expenses set deleted_at=now() where id=?",id)).isEqualTo(1);
        else assertThat(jdbc.update("update projects set deleted_at=now() where id=?",project.getId())).isEqualTo(1);
        org.mockito.Mockito.clearInvocations(storage);
        mvc.perform(get("/api/expenses/"+id+"/receipt")).andExpect(status().isNotFound());
        mvc.perform(multipart("/api/expenses/"+id+"/receipt").file(new org.springframework.mock.web.MockMultipartFile(
                "file","receipt.pdf","application/pdf","%PDF-1.7".getBytes())).with(r -> {r.setMethod("PUT"); return r;}))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.status").value(404));
        org.mockito.Mockito.verifyNoInteractions(storage);
    }
    @ParameterizedTest @ValueSource(booleans={false, true})
    @Transactional(propagation=org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    void retryPersistsPendingAcrossRequestsWithoutDuplicatingFinancialRecords(boolean expected) throws Exception {
        try {
            var request=body().put("receiptExpected",expected).put("paid",false).put("dueDate","2030-01-02");
            var response=mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(request.toString()))
                    .andExpect(status().isCreated()).andReturn().getResponse();
            String id=json.readTree(response.getContentAsString()).get("id").asText();
            mvc.perform(get("/api/expenses/"+id)).andExpect(jsonPath("$.receiptState").value(expected ? "PENDING" : "NONE"));
            org.mockito.Mockito.doThrow(new com.obracerta.exception.ReceiptException(
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,"Armazenamento indisponível."))
                    .doThrow(new com.obracerta.exception.ReceiptException(
                            org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,"Timeout."))
                    .doAnswer(invocation -> { objects.put(invocation.getArgument(0),
                        ((java.io.InputStream)invocation.getArgument(1)).readAllBytes()); return null; })
                    .when(storage).put(org.mockito.ArgumentMatchers.anyString(),org.mockito.ArgumentMatchers.any(),
                            org.mockito.ArgumentMatchers.anyLong(),org.mockito.ArgumentMatchers.anyString());
            var file=new org.springframework.mock.web.MockMultipartFile("file","receipt.pdf","application/pdf","receipt".getBytes());
            String paymentId=jdbc.queryForObject("select id from pending_payments where expense_id=?",String.class,id);
            for (int attempt=0; attempt<2; attempt++) {
                mvc.perform(multipart("/api/expenses/"+id+"/receipt").file(file).with(r -> {r.setMethod("PUT"); return r;}))
                        .andExpect(status().isServiceUnavailable());
                mvc.perform(get("/api/expenses/"+id)).andExpect(status().isOk())
                        .andExpect(jsonPath("$.receiptState").value("PENDING"))
                        .andExpect(jsonPath("$.paid").value(false)).andExpect(jsonPath("$.totalPrice").value(100.25))
                        .andExpect(jsonPath("$.dueDate").value("2030-01-02"));
                assertThat(jdbc.queryForObject("select receipt_state from expenses where id=?",String.class,id)).isEqualTo("PENDING");
            }
            mvc.perform(multipart("/api/expenses/"+id+"/receipt").file(file).with(r -> {r.setMethod("PUT"); return r;}))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id))
                    .andExpect(jsonPath("$.receiptState").value("UPLOADED"));
            mvc.perform(get("/api/expenses/"+id)).andExpect(jsonPath("$.receiptState").value("UPLOADED"));
            assertThat(jdbc.queryForObject("select count(*) from expenses where project_id=?",Long.class,project.getId())).isEqualTo(1);
            assertThat(jdbc.queryForObject("select sum(total_price) from expenses where project_id=?",java.math.BigDecimal.class,project.getId()))
                    .isEqualByComparingTo("100.25");
            assertThat(jdbc.queryForObject("select id from pending_payments where expense_id=?",String.class,id)).isEqualTo(paymentId);
            assertThat(jdbc.queryForObject("select count(*) from pending_payments where expense_id=?",Long.class,id)).isEqualTo(1);
            assertThat(objects).hasSize(1);
            when(identity.getAuthenticatedUser()).thenReturn(other);
            org.mockito.Mockito.clearInvocations(storage);
            mvc.perform(multipart("/api/expenses/"+id+"/receipt").file(file).with(r -> {r.setMethod("PUT"); return r;}))
                    .andExpect(status().isNotFound());
            org.mockito.Mockito.verifyNoInteractions(storage);
        } finally {
            jdbc.update("delete from pending_payments where expense_id in (select id from expenses where project_id=?)",project.getId());
            jdbc.update("delete from expenses where project_id=?",project.getId());
            jdbc.update("delete from suppliers where user_id=?",owner.getId());
            projects.deleteById(project.getId());
            users.deleteById(owner.getId()); users.deleteById(other.getId());
        }
    }
    @Test void failureNeverConfirmsUploadAndRetryUsesSamePrivateObjectAndFinancialRecord() throws Exception {
        String id=create(body().put("receiptExpected",true));
        org.mockito.Mockito.doThrow(new com.obracerta.exception.ReceiptException(
                org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,"Armazenamento indisponível."))
                .doAnswer(invocation -> { objects.put(invocation.getArgument(0),
                    ((java.io.InputStream)invocation.getArgument(1)).readAllBytes()); return null; })
                .when(storage).put(org.mockito.ArgumentMatchers.anyString(),org.mockito.ArgumentMatchers.any(),
                        org.mockito.ArgumentMatchers.anyLong(),org.mockito.ArgumentMatchers.anyString());
        var file=new org.springframework.mock.web.MockMultipartFile("file","receipt.pdf","application/pdf","receipt bytes".getBytes());
        mvc.perform(multipart("/api/expenses/"+id+"/receipt").file(file).with(r -> {r.setMethod("PUT"); return r;}))
                .andExpect(status().isServiceUnavailable()).andExpect(jsonPath("$.status").value(503));
        mvc.perform(get("/api/expenses/"+id)).andExpect(jsonPath("$.receiptState").value("PENDING"));
        mvc.perform(multipart("/api/expenses/"+id+"/receipt").file(file).with(r -> {r.setMethod("PUT"); return r;}))
                .andExpect(status().isOk()).andExpect(jsonPath("$.receiptState").value("UPLOADED"));
        assertThat(expenses.count()).isEqualTo(1);
        org.mockito.Mockito.clearInvocations(storage);
        mvc.perform(multipart("/api/expenses/"+id+"/receipt").file(file).with(r -> {r.setMethod("PUT"); return r;}))
                .andExpect(status().isConflict());
        org.mockito.Mockito.verifyNoInteractions(storage);
    }}
