package com.obracerta.service;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.model.entity.*;
import com.obracerta.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {
    @Mock ProjectRepository projects;
    @Mock ExpenseRepository expenses;
    @Mock UserContextHelper identity;
    PaymentService service;
    final LocalDate today = LocalDate.of(2026, 11, 4);

    @BeforeEach void setup() {
        service = new PaymentService(projects, expenses, identity,
                Clock.fixed(Instant.parse("2026-11-04T00:30:00Z"), ZoneOffset.UTC));
        when(identity.getAuthenticatedUser()).thenReturn(User.builder().id("owner").build());
    }

    @Test void computesOneUtcReferenceAndExactSumWithInclusiveUrgencyBoundaries() {
        when(projects.findByIdAndUserIdAndDeletedAtIsNull("project", "owner"))
                .thenReturn(Optional.of(Project.builder().id("project").build()));
        when(expenses.findPaymentAlerts("project", "owner", today.plusDays(7)))
                .thenReturn(List.of(expense("old", -40), expense("today", 0), expense("three", 3),
                        expense("four", 4), expense("seven", 7)));
        var result = service.getAlerts("project");
        assertThat(result.referenceDate()).isEqualTo(today);
        assertThat(result.projectId()).isEqualTo("project");
        assertThat(result.count()).isEqualTo(5);
        assertThat(result.totalAmount()).isEqualByComparingTo("50.55");
        assertThat(result.items()).extracting(item -> item.urgency().name())
                .containsExactly("OVERDUE", "DUE_SOON", "DUE_SOON", "REGULAR", "REGULAR");
        assertThat(result.items().getFirst().purchaseDate()).isEqualTo(today.minusDays(60));
        verify(expenses).findPaymentAlerts("project", "owner", today.plusDays(7));
    }

    @Test void emptyHasZeroCountAndAmount() {
        when(projects.findByIdAndUserIdAndDeletedAtIsNull("project", "owner"))
                .thenReturn(Optional.of(Project.builder().id("project").build()));
        when(expenses.findPaymentAlerts("project", "owner", today.plusDays(7))).thenReturn(List.of());
        var result = service.getAlerts("project");
        assertThat(result.count()).isZero();
        assertThat(result.totalAmount()).isEqualByComparingTo("0.00");
        assertThat(result.items()).isEmpty();
    }

    @Test void authorizesBeforeReadingAnyFinancialData() {
        when(projects.findByIdAndUserIdAndDeletedAtIsNull("other", "owner")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getAlerts("other")).isInstanceOf(ResourceNotFoundException.class);
        verifyNoInteractions(expenses);
    }

    private Expense expense(String id, int offset) {
        var expense = Expense.builder().id(id).description(id).purchaseDate(today.minusDays(60))
                .totalPrice(new BigDecimal("10.11")).paid(false).build();
        expense.setPendingPayment(PendingPayment.builder().dueDate(today.plusDays(offset)).build());
        return expense;
    }
}
