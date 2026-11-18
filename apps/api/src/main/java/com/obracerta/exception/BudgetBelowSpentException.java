package com.obracerta.exception;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

public class BudgetBelowSpentException extends RuntimeException {

    public BudgetBelowSpentException(BigDecimal spentAmount) {
        super("O orçamento não pode ser menor do que o total de despesas já realizadas nesta categoria: R$ "
                + formatAmount(spentAmount));
    }

    private static String formatAmount(BigDecimal amount) {
        NumberFormat format = NumberFormat.getNumberInstance(Locale.forLanguageTag("pt-BR"));
        format.setMinimumFractionDigits(2);
        format.setMaximumFractionDigits(2);
        return format.format(amount);
    }
}
