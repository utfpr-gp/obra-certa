package com.obracerta.service;

import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
import com.obracerta.exception.NfeAlreadyRegisteredException;
import com.obracerta.exception.ResourceNotFoundException;
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
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest @ActiveProfiles("test")
class NfeKeyGuardTest {

    @Autowired NfeKeyGuard guard;
    @Autowired UserRepository users;
    @Autowired ProjectRepository projects;
    @Autowired ExpenseCategoryRepository categories;
    @Autowired SupplierRepository suppliers;
    @Autowired ExpenseRepository expenses;
    @MockBean ReceiptStorage storage;

    @Test
    void refusesAKeyAlreadyActiveInTheSameProject() {
        Fixture fixture = fixture();
        String key = newKey();
        expenses.saveAndFlush(line(fixture, fixture.project(), key));

        assertThatThrownBy(() -> guard.ensureNotRegistered(fixture.project().getId(), key))
                .isInstanceOf(NfeAlreadyRegisteredException.class)
                .hasMessage("A nota fiscal já foi registrada");
    }

    @Test
    void acceptsTheSameKeyInAnotherProjectOfTheSameUser() {
        Fixture fixture = fixture();
        Project anotherProject = project(fixture.owner());
        String key = newKey();
        expenses.saveAndFlush(line(fixture, fixture.project(), key));

        assertThatCode(() -> guard.ensureNotRegistered(anotherProject.getId(), key))
                .doesNotThrowAnyException();
    }

    @Test
    void ignoresExpensesWithoutNfeKeyInTheSameProject() {
        Fixture fixture = fixture();
        expenses.saveAndFlush(line(fixture, fixture.project(), null));

        assertThatCode(() -> guard.ensureNotRegistered(fixture.project().getId(), newKey()))
                .doesNotThrowAnyException();
    }

    @Test
    void acceptsTheKeyAgainAfterEveryLineOfTheNoteIsSoftDeleted() {
        Fixture fixture = fixture();
        String key = newKey();
        Expense firstLine = expenses.saveAndFlush(line(fixture, fixture.project(), key));
        Expense secondLine = expenses.saveAndFlush(line(fixture, fixture.project(), key));
        firstLine.setDeletedAt(Instant.now());
        secondLine.setDeletedAt(Instant.now());
        expenses.saveAndFlush(firstLine);
        expenses.saveAndFlush(secondLine);

        assertThatCode(() -> guard.ensureNotRegistered(fixture.project().getId(), key))
                .doesNotThrowAnyException();
    }

    @Test
    void refusesWhenTheProjectIsSoftDeleted() {
        Fixture fixture = fixture();
        fixture.project().setDeletedAt(Instant.now());
        projects.saveAndFlush(fixture.project());

        assertThatThrownBy(() -> guard.ensureNotRegistered(fixture.project().getId(), newKey()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void refusesWhenTheProjectDoesNotExist() {
        assertThatThrownBy(() -> guard.ensureNotRegistered(newKey(), newKey()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void readOnlyCheckRefusesAKeyActiveInTheProjectWithoutTakingLock() {
        Fixture fixture = fixture();
        String key = newKey();
        expenses.saveAndFlush(line(fixture, fixture.project(), key));

        assertThatThrownBy(() -> guard.ensureNotRegisteredWithoutLock(fixture.project().getId(), key))
                .isInstanceOf(NfeAlreadyRegisteredException.class)
                .hasMessage("A nota fiscal já foi registrada");
    }

    @Test
    void readOnlyCheckAcceptsAKeyWithoutActiveLineInTheProject() {
        Fixture fixture = fixture();

        assertThatCode(() -> guard.ensureNotRegisteredWithoutLock(fixture.project().getId(), newKey()))
                .doesNotThrowAnyException();
    }

    private record Fixture(User owner, Project project, Supplier supplier, ExpenseCategory category) {}

    private Fixture fixture() {
        User owner = users.saveAndFlush(User.builder()
                .name("Dono da trava")
                .email("nfe-guard-" + UUID.randomUUID() + "@test.local")
                .password("test")
                .userRole(UserRole.USER)
                .build());
        Project project = project(owner);
        Supplier supplier = suppliers.saveAndFlush(Supplier.builder().user(owner).name("Loja da trava").build());
        ExpenseCategory category = categories.findAll().getFirst();
        return new Fixture(owner, project, supplier, category);
    }

    private Project project(User owner) {
        return projects.saveAndFlush(Project.builder()
                .user(owner)
                .name("Obra da trava")
                .type(ProjectType.RENOVATION)
                .status(ProjectStatus.IN_PROGRESS)
                .build());
    }

    private static Expense line(Fixture fixture, Project project, String nfeKey) {
        return Expense.builder()
                .user(fixture.owner())
                .project(project)
                .category(fixture.category())
                .supplier(fixture.supplier())
                .type("MATERIAL")
                .description("Item da trava")
                .totalPrice(new BigDecimal("10.00"))
                .purchaseDate(LocalDate.of(2030, 1, 1))
                .nfeKey(nfeKey)
                .build();
    }

    private static String newKey() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
