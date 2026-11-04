package com.obracerta.controller;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.*;
import com.obracerta.model.entity.*;
import com.obracerta.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc(addFilters = false)
@Transactional
class PaymentAlertsIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired ProjectRepository projects;
    @Autowired ExpenseRepository expenses;
    @Autowired ExpenseCategoryRepository categories;
    @Autowired SupplierRepository suppliers;
    @MockBean UserContextHelper identity;
    @MockBean Clock clock;
    User owner;
    Project project;
    Supplier supplier;
    final LocalDate today = LocalDate.of(2026, 11, 4);

    @BeforeEach void setup() {
        owner = user();
        project = projects.saveAndFlush(Project.builder().user(owner).name("Casa")
                .type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build());
        supplier = suppliers.saveAndFlush(Supplier.builder().user(owner).name("Loja").build());
        when(identity.getAuthenticatedUser()).thenReturn(owner);
        when(clock.instant()).thenReturn(Instant.parse("2026-11-04T00:30:00Z"));
        when(clock.getZone()).thenReturn(ZoneOffset.UTC);
    }

    @Test void selectsFullHorizonWithExactSummaryStableTiesAndAllExclusions() throws Exception {
        expense("vencida", -100);
        Expense a = expense("hoje-a", 0), b = expense("hoje-b", 0);
        expense("mais-tres", 3); expense("mais-quatro", 4); expense("mais-sete", 7);
        expense("fora", 8);
        Expense paid = expense("paga", 0); paid.setPaid(true); expenses.saveAndFlush(paid);
        Expense statusPaid = expense("status-pago", 0);
        statusPaid.getPendingPayment().setStatus(PaymentStatus.PAID); expenses.saveAndFlush(statusPaid);
        Expense noDate = expense("sem-data", 0);
        noDate.getPendingPayment().setDueDate(null); expenses.saveAndFlush(noDate);
        Expense deleted = expense("despesa-excluida", 0);
        deleted.setDeletedAt(Instant.now()); expenses.saveAndFlush(deleted);
        Expense paymentDeleted = expense("pagamento-excluido", 0);
        paymentDeleted.getPendingPayment().setDeletedAt(Instant.now()); expenses.saveAndFlush(paymentDeleted);
        Project original = project;
        project = projects.saveAndFlush(Project.builder().user(owner).name("Outra")
                .type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build());
        expense("outra-obra", 0); project = original;
        List<String> ties = new ArrayList<>(List.of(a.getId(), b.getId())); Collections.sort(ties);
        mvc.perform(get(path()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectId").value(project.getId()))
                .andExpect(jsonPath("$.referenceDate").value("2026-11-04"))
                .andExpect(jsonPath("$.count").value(6))
                .andExpect(jsonPath("$.totalAmount").value(60.66))
                .andExpect(jsonPath("$.items.length()").value(6))
                .andExpect(jsonPath("$.items[0].description").value("vencida"))
                .andExpect(jsonPath("$.items[0].urgency").value("OVERDUE"))
                .andExpect(jsonPath("$.items[1].expenseId").value(ties.get(0)))
                .andExpect(jsonPath("$.items[2].expenseId").value(ties.get(1)))
                .andExpect(jsonPath("$.items[3].urgency").value("DUE_SOON"))
                .andExpect(jsonPath("$.items[4].urgency").value("REGULAR"))
                .andExpect(jsonPath("$.items[5].dueDate").value("2026-11-11"))
                .andExpect(jsonPath("$.items[5].totalPrice").value(10.11))
                .andExpect(jsonPath("$.items[5].purchaseDate").value("2026-01-01"));
    }

    @Test void returnsEmptyAndDoesNotTruncateAtFifteen() throws Exception {
        mvc.perform(get(path())).andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0)).andExpect(jsonPath("$.totalAmount").value(0))
                .andExpect(jsonPath("$.items").isEmpty());
        for (int i = 0; i < 18; i++) expense("conta-" + i, 7);
        mvc.perform(get(path())).andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(18)).andExpect(jsonPath("$.items.length()").value(18))
                .andExpect(jsonPath("$.totalAmount").value(181.98));
    }

    @Test void returns404ForForeignMissingAndDeletedProjects() throws Exception {
        expense("privada", 0);
        when(identity.getAuthenticatedUser()).thenReturn(user());
        mvc.perform(get(path())).andExpect(status().isNotFound()).andExpect(jsonPath("$.items").doesNotExist());
        when(identity.getAuthenticatedUser()).thenReturn(owner);
        mvc.perform(get("/api/projects/" + UUID.randomUUID() + "/payment-alerts")).andExpect(status().isNotFound());
        project.setDeletedAt(Instant.now()); projects.saveAndFlush(project);
        mvc.perform(get(path())).andExpect(status().isNotFound()).andExpect(jsonPath("$.items").doesNotExist());
    }

    private String path() { return "/api/projects/" + project.getId() + "/payment-alerts"; }
    private User user() {
        return users.saveAndFlush(User.builder().name("Dono").email(UUID.randomUUID() + "@test.local")
                .password("test").userRole(UserRole.USER).build());
    }
    private Expense expense(String description, int offset) {
        Expense value = Expense.builder().project(project).user(owner).category(categories.findAll().getFirst())
                .supplier(supplier).description(description).purchaseDate(LocalDate.of(2026, 1, 1))
                .totalPrice(new BigDecimal("10.11")).paid(false).build();
        value.setPendingPayment(PendingPayment.builder().expense(value).dueDate(today.plusDays(offset))
                .status(PaymentStatus.PENDING).build());
        return expenses.saveAndFlush(value);
    }
}
