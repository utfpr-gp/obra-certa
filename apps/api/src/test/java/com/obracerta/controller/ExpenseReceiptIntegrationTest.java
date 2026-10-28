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
        byte[] bytes;
        if (extension.equals("pdf")) bytes=("%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
                +"2 0 obj\n<< /Type /Pages /Count 0 /Kids [] >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n").getBytes();
        else {
            var image=new java.awt.image.BufferedImage(1,1,java.awt.image.BufferedImage.TYPE_INT_RGB);
            var output=new java.io.ByteArrayOutputStream(); javax.imageio.ImageIO.write(image,extension,output); bytes=output.toByteArray();
        }
        var file=new org.springframework.mock.web.MockMultipartFile("file","../../receipt."+extension,type,bytes);
        mvc.perform(multipart("/api/expenses/"+id+"/receipt").file(file).with(r -> {r.setMethod("PUT"); return r;}))
                .andExpect(status().isOk()).andExpect(jsonPath("$.receiptState").value("UPLOADED"))
                .andExpect(jsonPath("$.receiptKey").doesNotExist());
        mvc.perform(get("/api/expenses/"+id+"/receipt")).andExpect(status().isOk())
                .andExpect(content().bytes(bytes)).andExpect(content().contentType(type))
                .andExpect(header().string("Content-Disposition",org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("../"))));
    }
    @Test void acceptsExactlyTenMebibytes() throws Exception {
        String id=create(body().put("receiptExpected",true));
        // A complete one-page PDF, padded with legal whitespace before its cross-reference table.
        var document=new StringBuilder("%PDF-1.7\n");
        String[] definitions={"<< /Type /Catalog /Pages 2 0 R >>",
                "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
                "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] /Resources << >> >>"};
        int[] offsets=new int[4];
        for (int index=1;index<=3;index++) {
            offsets[index]=document.length();
            document.append(index).append(" 0 obj\n").append(definitions[index-1]).append("\nendobj\n");
        }
        var table=new StringBuilder("xref\n0 4\n0000000000 65535 f \n");
        for (int index=1;index<=3;index++)
            table.append(String.format(java.util.Locale.ROOT,"%010d 00000 n \n",offsets[index]));
        java.util.function.IntFunction<String> trailer=position -> table
                +"trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n"
                +String.format(java.util.Locale.ROOT,"%010d",position)+"\n%%EOF\n";
        byte[] bytes=new byte[10485760]; java.util.Arrays.fill(bytes,(byte)' ');
        byte[] header=document.toString().getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        int xrefPosition=bytes.length-trailer.apply(0).length();
        byte[] ending=trailer.apply(xrefPosition).getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        System.arraycopy(header,0,bytes,0,header.length); bytes[xrefPosition-1]='\n';
        System.arraycopy(ending,0,bytes,xrefPosition,ending.length);
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
    @Test void failureNeverConfirmsUploadAndRetryUsesSamePrivateObjectAndFinancialRecord() throws Exception {
        String id=create(body().put("receiptExpected",true));
        org.mockito.Mockito.doThrow(new com.obracerta.exception.ReceiptException(
                org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,"Armazenamento indisponível."))
                .doAnswer(invocation -> { objects.put(invocation.getArgument(0),
                    ((java.io.InputStream)invocation.getArgument(1)).readAllBytes()); return null; })
                .when(storage).put(org.mockito.ArgumentMatchers.anyString(),org.mockito.ArgumentMatchers.any(),
                        org.mockito.ArgumentMatchers.anyLong(),org.mockito.ArgumentMatchers.anyString());
        var file=new org.springframework.mock.web.MockMultipartFile("file","receipt.pdf","application/pdf","%PDF-1.7".getBytes());
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
