package com.obracerta.service;

import com.obracerta.model.dto.report.*;
import com.obracerta.model.entity.*;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;

class ReportPdfServiceTest {
    private final ReportPdfService service = new ReportPdfService(Clock.fixed(Instant.parse("2026-11-02T15:30:00Z"), ZoneOffset.UTC));

    @Test
    void exportsConsolidationPaymentsBalancesAndIndividualExpensesWithDeterministicDate() throws Exception {
        var report = new ReportResponseDTO("p1", "Reforma São João", money("1000"), money("1200"), money("900"), money("300"),
                List.of(new ReportCategoryDTO("c1", "Elétrica", money("1200"), money("1000"), money("100"))));
        var expense = Expense.builder().description("Instalação elétrica").purchaseDate(LocalDate.of(2026, 10, 31))
                .category(ExpenseCategory.builder().name("Elétrica").build()).totalPrice(money("300")).paid(false).build();
        var pdf = service.generate(report, List.of(expense));
        assertThat(pdf.filename()).isEqualTo("relatorio-reforma-sao-joao-2026-11-02.pdf");
        try (var document = Loader.loadPDF(pdf.content())) {
            String text = new PDFTextStripper().getText(document);
            assertThat(text).contains("Reforma São João", "p1", "02/11/2026", "Total orçado: R$ 1.000,00",
                    "Total realizado: R$ 1.200,00", "Pago: R$ 900,00", "A pagar: R$ 300,00", "Saldo: -R$ 200,00",
                    "Elétrica", "Instalação elétrica", "31/10/2026");
        }
    }

    @Test
    void exportsEmptyProjectAndSafeFilename() throws Exception {
        var pdf = service.generate(new ReportResponseDTO("p", "../Casa\r\n/ João", money("0"), money("0"), money("0"), money("0"), List.of()), List.of());
        assertThat(pdf.filename()).isEqualTo("relatorio-casa-joao-2026-11-02.pdf");
        try (var document = Loader.loadPDF(pdf.content())) {
            assertThat(new PDFTextStripper().getText(document)).contains("Sem despesas ativas", "Total realizado: R$ 0,00");
        }
    }

    @Test
    void wrapsLongNamesAndDescriptionsAcrossMultiplePagesWithoutLosingText() throws Exception {
        String name = "São João Αθήνα Москва ".repeat(40);
        var expenses = new ArrayList<Expense>();
        for (int i = 0; i < 90; i++) expenses.add(Expense.builder().description("Descrição " + i + " " + "acentuação ".repeat(25) + "fim" + i)
                .purchaseDate(LocalDate.of(2026, 1, 1)).category(ExpenseCategory.builder().name("Elétrica").build()).totalPrice(money("1")).paid(true).build());
        var pdf = service.generate(new ReportResponseDTO("p", name, money("0"), money("90"), money("90"), money("0"), List.of()), expenses);
        try (var document = Loader.loadPDF(pdf.content())) {
            assertThat(document.getNumberOfPages()).isGreaterThan(2);
            assertThat(new PDFTextStripper().getText(document)).contains("fim0", "fim89", "Pago", "Αθήνα", "Москва");
        }
    }
    private BigDecimal money(String amount) { return new BigDecimal(amount); }
}
