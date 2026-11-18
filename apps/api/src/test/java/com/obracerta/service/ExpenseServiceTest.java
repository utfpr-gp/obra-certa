package com.obracerta.service;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.model.dto.expense.ExpenseCreateDTO;
import com.obracerta.model.entity.*;
import com.obracerta.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;
import com.obracerta.exception.ExpenseValidationException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {
    @Mock UserContextHelper identity;
    @Mock ProjectRepository projects;
    @Mock ExpenseCategoryRepository categories;
    @Mock SupplierRepository suppliers;
    @Mock BudgetRepository budgets;
    @Mock ExpenseRepository expenses;
    ExpenseService service;
    User owner = User.builder().id("owner").build();
    Project project = Project.builder().id("project").user(owner).build();
    Supplier supplier = Supplier.builder().id("supplier").name("Loja").build();
    ExpenseCategory category = ExpenseCategory.builder().id("category").name("Alvenaria").build();

    @BeforeEach void setup() {
        service = new ExpenseService(identity, projects, categories, suppliers, budgets, expenses);
        lenient().when(identity.getAuthenticatedUser()).thenReturn(owner);
        lenient().when(projects.findByIdAndUserIdAndDeletedAtIsNull("project", "owner")).thenReturn(Optional.of(project));
        lenient().when(categories.findById("category")).thenReturn(Optional.of(category));
        lenient().when(suppliers.findByIdAndUserId("supplier","owner")).thenReturn(Optional.of(supplier));
        lenient().when(expenses.save(any())).thenAnswer(call -> call.getArgument(0));
    }
    ExpenseCreateDTO request(String mode, String quantity, String unitPrice, String total) {
        return new ExpenseCreateDTO("project", "Cimento", LocalDate.of(2030,1,1), "category",
                "supplier", null, true, mode, number(quantity), number(unitPrice), number(total), null, false);
    }
    BigDecimal number(String value) { return value == null ? null : new BigDecimal(value); }
    @ParameterizedTest @NullAndEmptySource @ValueSource(strings={"   \t"})
    void createsSupplierWithNullDocumentWithoutLookingUpAnAbsentCnpj(String document) {
        when(suppliers.save(any())).thenAnswer(call -> call.getArgument(0));
        var request = new ExpenseCreateDTO("project", "Cimento", LocalDate.of(2030,1,1), "category",
                null, new ExpenseCreateDTO.NewSupplierDTO("Loja",document), true,"DIRECT",null,null,
                new BigDecimal("1.00"),null,false);
        assertThat(service.create(request).supplier().document()).isNull();
        verify(suppliers,never()).findFirstByUserIdAndDocument(any(),any());
        verify(suppliers).save(argThat(saved -> saved.getDocument()==null && saved.getName().equals("Loja")));
    }
    @Test void createsDirectWithoutQuantityOrBudget() {
        var result = service.create(request("DIRECT", null, null, "100.25"));
        assertThat(result.totalPrice()).isEqualByComparingTo("100.25");
        assertThat(result.quantity()).isNull();
        var captured=org.mockito.ArgumentCaptor.forClass(Expense.class);
        verify(expenses).save(captured.capture());
        assertThat(captured.getValue().getBudget()).isNull();
        assertThat(captured.getValue().getPendingPayment()).isNull();
        assertThat(captured.getValue().getProject()).isSameAs(project);
    }
    @Test void calculatesWithHalfUpAndDoesNotTrustClientTotal() {
        var result = service.create(request("CALCULATED", "1.50", "1.01", "999"));
        assertThat(result.totalPrice()).isEqualByComparingTo("1.52");
    }
    @ParameterizedTest @ValueSource(strings={"0","-1","0.001","10000000000000","1.234"})
    void rejectsInvalidDirectAmountsWithoutWriting(String amount) {
        assertThatThrownBy(() -> service.create(request("DIRECT",null,null,amount)))
                .isInstanceOf(ExpenseValidationException.class);
        verifyNoInteractions(expenses);
        verify(suppliers, never()).save(any());
    }
    @Test void rejectsRoundedZeroAndOverflowAndMissingCalculatedFields() {
        for (var request : java.util.List.of(request("CALCULATED","0.01","0.01",null),
                request("CALCULATED","99999999.99","9999999999999.99",null),
                request("CALCULATED",null,"1",null),request("CALCULATED","1","0",null))) {
            assertThatThrownBy(() -> service.create(request)).isInstanceOf(ExpenseValidationException.class);
        }
        verifyNoInteractions(expenses);
    }
    @Test void manualCreateWithKnownCnpjReusesSupplierWithoutRenaming() {
        var existing = Supplier.builder().id("known").user(owner).name("Nome Antigo").document("12345678000190").build();
        when(suppliers.findFirstByUserIdAndDocument("owner", "12345678000190")).thenReturn(Optional.of(existing));
        when(suppliers.save(any())).thenAnswer(call -> call.getArgument(0));
        var request = new ExpenseCreateDTO("project", "Cimento", LocalDate.of(2030,1,1), "category",
                null, new ExpenseCreateDTO.NewSupplierDTO("Razão Digitada", "12.345.678/0001-90"), true,"DIRECT",null,null,
                new BigDecimal("1.00"),null,false);
        service.create(request);
        assertThat(existing.getName()).isEqualTo("Nome Antigo");
        verify(suppliers).save(argThat(saved -> saved == existing));
    }
    @Test void foreignOrDeletedProjectIs404BeforeWriting() {
        when(projects.findByIdAndUserIdAndDeletedAtIsNull("project","owner")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.create(request("DIRECT",null,null,"1")))
                .isInstanceOf(ResourceNotFoundException.class);
        verifyNoInteractions(expenses, suppliers);
    }
}
