package com.obracerta.service;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
import com.obracerta.exception.NfeAlreadyRegisteredException;
import com.obracerta.integration.ReceiptStorage;
import com.obracerta.model.entity.Expense;
import com.obracerta.model.entity.ExpenseCategory;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.Supplier;
import com.obracerta.model.entity.User;
import com.obracerta.repository.ExpenseCategoryRepository;
import com.obracerta.repository.ExpenseRepository;
import com.obracerta.repository.ProjectRepository;
import com.obracerta.repository.SupplierRepository;
import com.obracerta.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@SpringBootTest @ActiveProfiles("test")
class ExpenseServiceDeleteNfeTest {

    @Autowired ExpenseService service;
    @Autowired NfeKeyGuard guard;
    @Autowired UserRepository users;
    @Autowired ProjectRepository projects;
    @Autowired ExpenseCategoryRepository categories;
    @Autowired SupplierRepository suppliers;
    @Autowired ExpenseRepository expenses;
    @MockBean UserContextHelper identity;
    @MockBean ReceiptStorage storage;

    @Test
    void deletingOneLineOfANoteThroughTheServiceKeepsItsKeyBlockedForNewImports() {
        User owner = users.saveAndFlush(User.builder()
                .name("Dono da nota")
                .email("nfe-delete-" + UUID.randomUUID() + "@test.local")
                .password("test")
                .userRole(UserRole.USER)
                .build());
        when(identity.getAuthenticatedUser()).thenReturn(owner);
        Project project = projects.saveAndFlush(Project.builder()
                .user(owner)
                .name("Obra da nota")
                .type(ProjectType.RENOVATION)
                .status(ProjectStatus.IN_PROGRESS)
                .build());
        Supplier supplier = suppliers.saveAndFlush(Supplier.builder().user(owner).name("Loja da nota").build());
        ExpenseCategory category = categories.findAll().getFirst();
        String key = UUID.randomUUID().toString().replace("-", "");

        Expense firstLine = expenses.saveAndFlush(line(owner, project, supplier, category, key));
        Expense secondLine = expenses.saveAndFlush(line(owner, project, supplier, category, key));

        service.delete(firstLine.getId());

        assertThat(expenses.findById(firstLine.getId()).orElseThrow().getDeletedAt()).isNotNull();
        assertThat(expenses.findById(secondLine.getId()).orElseThrow().getDeletedAt()).isNull();
        assertThatThrownBy(() -> guard.ensureNotRegistered(project.getId(), key))
                .isInstanceOf(NfeAlreadyRegisteredException.class);
    }

    private static Expense line(User owner, Project project, Supplier supplier, ExpenseCategory category, String key) {
        return Expense.builder()
                .user(owner)
                .project(project)
                .category(category)
                .supplier(supplier)
                .type("MATERIAL")
                .description("Item da nota")
                .totalPrice(new BigDecimal("10.00"))
                .purchaseDate(LocalDate.of(2030, 1, 1))
                .nfeKey(key)
                .build();
    }
}
