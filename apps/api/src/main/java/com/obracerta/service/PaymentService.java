package com.obracerta.service;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.exception.ExpenseValidationException;
import com.obracerta.enums.PaymentStatus;
import com.obracerta.mapper.ExpenseMapper;
import com.obracerta.model.dto.expense.ExpenseResponseDTO;
import com.obracerta.model.dto.payment.PaymentSettlementRequestDTO;
import com.obracerta.mapper.PaymentMapper;
import com.obracerta.model.dto.payment.PaymentAlertItemDTO;
import com.obracerta.model.dto.payment.PaymentAlertItemDTO.Urgency;
import com.obracerta.model.dto.payment.PaymentAlertsDTO;
import com.obracerta.repository.ExpenseRepository;
import com.obracerta.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;

@Service
public class PaymentService {
    private final ProjectRepository projects;
    private final ExpenseRepository expenses;
    private final UserContextHelper identity;
    private final Clock clock;

    public PaymentService(ProjectRepository projects, ExpenseRepository expenses,
                          UserContextHelper identity, Clock clock) {
        this.projects = projects;
        this.expenses = expenses;
        this.identity = identity;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PaymentAlertsDTO getAlerts(String projectId) {
        String userId = identity.getAuthenticatedUser().getId();
        projects.findByIdAndUserIdAndDeletedAtIsNull(projectId, userId)
                .orElseThrow(ResourceNotFoundException::new);
        LocalDate referenceDate = LocalDate.ofInstant(clock.instant(), ZoneOffset.UTC);
        var items = expenses.findPaymentAlerts(projectId, userId, referenceDate.plusDays(7)).stream()
                .map(expense -> {
                    LocalDate dueDate = expense.getPendingPayment().getDueDate();
                    Urgency urgency = dueDate.isBefore(referenceDate) ? Urgency.OVERDUE
                            : !dueDate.isAfter(referenceDate.plusDays(3)) ? Urgency.DUE_SOON : Urgency.REGULAR;
                    return PaymentMapper.toAlertItemDTO(expense, urgency);
                }).toList();
        BigDecimal total = items.stream().map(PaymentAlertItemDTO::totalPrice)
                .reduce(new BigDecimal("0.00"), BigDecimal::add);
        return new PaymentAlertsDTO(projectId, referenceDate, items.size(), total, items);
    }

    @Transactional
    public ExpenseResponseDTO settle(String projectId, String expenseId, PaymentSettlementRequestDTO request) {
        String userId = identity.getAuthenticatedUser().getId();
        projects.findByIdAndUserIdAndDeletedAtIsNull(projectId, userId)
                .orElseThrow(ResourceNotFoundException::new);
        expenses.lockActivePaymentExpense(expenseId, projectId, userId)
                .orElseThrow(ResourceNotFoundException::new);
        // The scalar lock above must precede loading either side of the one-to-one association.
        var expense = expenses.findActiveByIdAndOwner(expenseId, userId)
                .orElseThrow(ResourceNotFoundException::new);
        var payment = expense.getPendingPayment();
        if (payment != null && payment.getDeletedAt() != null) throw new ResourceNotFoundException();
        if (expense.isPaid()) return ExpenseMapper.toDTO(expense);
        if (payment == null) throw new ResourceNotFoundException();
        if (request.paymentDate() == null || request.paymentDate().isBefore(expense.getPurchaseDate())) {
            throw new ExpenseValidationException("A data do pagamento deve ser igual ou posterior à data da despesa");
        }
        expense.setPaid(true);
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(request.paymentDate().atStartOfDay(ZoneOffset.UTC).toInstant());
        return ExpenseMapper.toDTO(expense);
    }
}
