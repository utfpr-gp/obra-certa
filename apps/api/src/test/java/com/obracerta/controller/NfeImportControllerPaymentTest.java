package com.obracerta.controller;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
import com.obracerta.integration.ReceiptStorage;
import com.obracerta.model.entity.ExpenseCategory;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.User;
import com.obracerta.repository.ExpenseCategoryRepository;
import com.obracerta.repository.ProjectRepository;
import com.obracerta.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// CA5 (pagamento e comprovante) na primeira linha apenas. Uma nota com dois itens.
@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc(addFilters = false)
class NfeImportControllerPaymentTest {

    private static final String XML_TYPE = "application/xml";
    private static final String FIRST_ITEM = "Cimento CP-II 50kg";
    private static final String SECOND_ITEM = "Areia média lavada";
    private static final String CONFIRM = "/nfe/imports";
    private static final String RECEIPT_FAILURE = "Não foi possível enviar o comprovante. Tente novamente.";

    @Autowired private MockMvc mvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private UserRepository users;
    @Autowired private ProjectRepository projects;
    @Autowired private ExpenseCategoryRepository categories;
    @MockBean private UserContextHelper identity;
    @MockBean private ReceiptStorage storage;

    private User owner;
    private Project project;
    private ExpenseCategory first;
    private ExpenseCategory second;
    private final List<String> putKeys = new ArrayList<>();
    private final List<String> putTypes = new ArrayList<>();
    private final List<Long> putSizes = new ArrayList<>();
    private final List<byte[]> putContents = new ArrayList<>();

    @BeforeEach
    void setUp() {
        putKeys.clear();
        putTypes.clear();
        putSizes.clear();
        putContents.clear();
        owner = users.saveAndFlush(user());
        project = projects.saveAndFlush(Project.builder().user(owner).name("Casa")
                .type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build());
        var all = categories.findAll();
        assertThat(all.size()).isGreaterThanOrEqualTo(2);
        first = all.get(0);
        second = all.get(1);
        org.mockito.Mockito.when(identity.getAuthenticatedUser()).thenReturn(owner);
        doAnswer(invocation -> {
            putKeys.add(invocation.getArgument(0));
            putTypes.add(invocation.getArgument(3));
            putSizes.add(invocation.getArgument(2));
            putContents.add(((java.io.InputStream) invocation.getArgument(1)).readAllBytes());
            return null;
        }).when(storage).put(anyString(), any(), anyLong(), anyString());
    }

    @Test
    void paidTrueGravaPagamentoUnicoPagoNaPrimeiraLinhaEComprovanteXmlSoNela() throws Exception {
        mvc.perform(confirm("{\"paid\":true}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.length()").value(2));

        var cimento = item(FIRST_ITEM);
        assertThat(cimento.get("paid")).isEqualTo(true);
        assertThat(cimento.get("receipt_state")).isEqualTo("UPLOADED");
        assertThat(cimento.get("receipt_content_type")).isEqualTo(XML_TYPE);
        assertThat(cimento.get("receipt_key")).isNotNull();
        assertThat(((Number) cimento.get("receipt_size")).longValue()).isPositive();

        var payment = onlyPayment();
        assertThat(payment.get("description")).isEqualTo(FIRST_ITEM);
        assertThat(payment.get("status")).isEqualTo("PAID");
        assertThat(payment.get("due_date")).isNull();
        assertThat(payment.get("paid_at_utc")).isEqualTo("2026-10-15T00:00:00Z");

        var areia = item(SECOND_ITEM);
        assertThat(areia.get("paid")).isEqualTo(true);
        assertThat(areia.get("receipt_state")).isEqualTo("NONE");
        assertThat(areia.get("receipt_key")).isNull();
        assertThat(areia.get("receipt_content_type")).isNull();
        assertThat(areia.get("receipt_size")).isNull();
        assertThat(paymentCount()).isEqualTo(1);

        assertThat(putKeys).hasSize(1);
        assertThat(putKeys.get(0)).isEqualTo(cimento.get("receipt_key"));
        assertThat(putTypes).containsExactly(XML_TYPE);
        assertThat(putSizes.get(0)).isEqualTo(((Number) cimento.get("receipt_size")).longValue());
        byte[] nota = new ClassPathResource("nfe/nfe-valida.xml").getContentAsByteArray();
        assertThat(putContents).singleElement().satisfies(content -> assertThat(content).isEqualTo(nota));
    }

    @Test
    void paidFalseGravaPagamentoUnicoPendenteComVencimentoNaEmissao() throws Exception {
        mvc.perform(confirm("{\"paid\":false}"))
                .andExpect(status().isCreated());

        var cimento = item(FIRST_ITEM);
        assertThat(cimento.get("paid")).isEqualTo(false);
        assertThat(cimento.get("receipt_state")).isEqualTo("UPLOADED");

        var payment = onlyPayment();
        assertThat(payment.get("description")).isEqualTo(FIRST_ITEM);
        assertThat(payment.get("status")).isEqualTo("PENDING");
        assertThat(String.valueOf(payment.get("due_date"))).isEqualTo("2026-10-15");
        assertThat(payment.get("paid_at_utc")).isNull();

        var areia = item(SECOND_ITEM);
        assertThat(areia.get("paid")).isEqualTo(false);
        assertThat(areia.get("receipt_state")).isEqualTo("NONE");
        assertThat(paymentCount()).isEqualTo(1);
    }

    @Test
    void partePaymentAusenteAssumePago() throws Exception {
        mvc.perform(confirm(null)).andExpect(status().isCreated());

        assertThat(item(FIRST_ITEM).get("paid")).isEqualTo(true);
        assertThat(onlyPayment().get("status")).isEqualTo("PAID");
        assertThat(paymentCount()).isEqualTo(1);
    }

    @Test
    void falhaDoUploadRetorna503ComCorpoENadaGravado() throws Exception {
        doThrow(new RuntimeException("storage down"))
                .when(storage).put(anyString(), any(), anyLong(), anyString());

        mvc.perform(confirm("{\"paid\":true}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503))
                .andExpect(jsonPath("$.message").value(RECEIPT_FAILURE))
                .andExpect(jsonPath("$.path").value("/api/projects/" + project.getId() + CONFIRM));

        assertThat(expenseCount()).isZero();
        assertThat(paymentCount()).isZero();
        assertThat(supplierCount()).isZero();
        verify(storage, never()).delete(anyString());
    }

    private Map<String, Object> item(String description) {
        return jdbc.queryForMap("select e.paid, e.receipt_state, e.receipt_key, e.receipt_content_type, "
                + "e.receipt_size from expenses e where e.project_id = ? and e.description = ?",
                project.getId(), description);
    }

    private Map<String, Object> onlyPayment() {
        var payments = jdbc.queryForList("select e.description, p.status, p.due_date, "
                + "to_char(p.paid_at at time zone 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') as paid_at_utc "
                + "from pending_payments p join expenses e on e.id = p.expense_id "
                + "where e.project_id = ?", project.getId());
        assertThat(payments).hasSize(1);
        return payments.get(0);
    }

    private long paymentCount() {
        return jdbc.queryForObject("select count(*) from pending_payments p "
                + "join expenses e on e.id = p.expense_id where e.project_id = ?", Long.class, project.getId());
    }

    private long expenseCount() {
        return jdbc.queryForObject("select count(*) from expenses where project_id = ?", Long.class, project.getId());
    }

    private long supplierCount() {
        return jdbc.queryForObject("select count(*) from suppliers where user_id = ?", Long.class, owner.getId());
    }

    private MockHttpServletRequestBuilder confirm(String paymentJson) throws Exception {
        var items = new MockMultipartFile("items", "items.json", "application/json",
                ("{\"items\":[{\"itemNumber\":1,\"categoryId\":\"" + first.getId() + "\"},"
                        + "{\"itemNumber\":2,\"categoryId\":\"" + second.getId() + "\"}]}")
                        .getBytes(StandardCharsets.UTF_8));
        var request = multipart("/api/projects/" + project.getId() + CONFIRM)
                .file(nota())
                .file(items);
        if (paymentJson != null) {
            request.file(new MockMultipartFile("payment", "payment.json", "application/json",
                    paymentJson.getBytes(StandardCharsets.UTF_8)));
        }
        return request;
    }

    private MockMultipartFile nota() throws Exception {
        var bytes = new ClassPathResource("nfe/nfe-valida.xml").getContentAsByteArray();
        return new MockMultipartFile("file", "nfe-valida.xml", XML_TYPE, bytes);
    }

    private User user() {
        return User.builder().name("Proprietário")
                .email("nfe-payment-" + UUID.randomUUID() + "@example.com")
                .password("unused-password").userRole(UserRole.USER).build();
    }

    @AfterEach
    void removeOnlyThisFixture() {
        if (project == null) return;
        jdbc.update("delete from pending_payments where expense_id in "
                + "(select id from expenses where project_id = ?)", project.getId());
        jdbc.update("delete from expenses where project_id = ?", project.getId());
        jdbc.update("delete from projects where id = ?", project.getId());
        jdbc.update("delete from suppliers where user_id = ?", owner.getId());
        users.deleteById(owner.getId());
    }
}
