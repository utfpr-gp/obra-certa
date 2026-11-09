package com.obracerta.service;

import com.obracerta.exception.ReportPdfException;
import com.obracerta.model.dto.report.ReportPdfDTO;
import com.obracerta.model.dto.report.ReportResponseDTO;
import com.obracerta.model.entity.Expense;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.*;
import org.springframework.stereotype.Service;
import java.io.*;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.text.NumberFormat;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ReportPdfService {
    private final Clock clock;

    public ReportPdfService(Clock clock) { this.clock = clock; }

    public ReportPdfDTO generate(ReportResponseDTO report, List<Expense> expenses) {
        LocalDate date = LocalDate.now(clock);
        NumberFormat currency = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("pt-BR"));
        DateTimeFormatter dates = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream bytes = new ByteArrayOutputStream()) {
            try (PageWriter writer = new PageWriter(document)) {
                writer.line("ObraCerta - Relatório financeiro", true);
                writer.line("Obra: " + report.projectName(), true);
                writer.line("Identificação: " + report.projectId(), false);
                writer.line("Data de geração: " + date.format(dates) + " (UTC)", false);
                writer.line("Todo o histórico da obra", false);
                writer.line("Total orçado: " + money(currency, report.totalPlanned()), false);
                writer.line("Total realizado: " + money(currency, report.totalSpent()), false);
                writer.line("Pago: " + money(currency, report.totalPaid()), false);
                writer.line("A pagar: " + money(currency, report.totalPending()), false);
                writer.line("Saldo: " + money(currency, report.totalPlanned().subtract(report.totalSpent())), false);
                writer.line("Balanço por categoria", true);
                for (var category : report.categories()) {
                    writer.line(category.categoryName(), true);
                    writer.line("Orçado: " + money(currency, category.plannedAmount()) + " | Realizado: " + money(currency, category.amount())
                            + " | Saldo: " + money(currency, category.plannedAmount().subtract(category.amount())), false);
                }
                writer.line("Despesas ativas - detalhamento individual", true);
                if (expenses.isEmpty()) writer.line("Sem despesas ativas", false);
                for (var expense : expenses) {
                    writer.line(expense.getDescription(), true);
                    writer.line(expense.getPurchaseDate().format(dates) + " | " + expense.getCategory().getName()
                            + " | " + money(currency, expense.getTotalPrice()) + " | " + (expense.isPaid() ? "Pago" : "A pagar"), false);
                }
            }
            document.save(bytes);
            return new ReportPdfDTO(filename(report.projectName(), date), bytes.toByteArray());
        } catch (IOException exception) {
            throw new ReportPdfException(exception);
        }
    }

    /** Shared naming rule between the legacy PDF and the visual export snapshot. */
    public static String filename(String projectName, LocalDate date) {
        return "relatorio-" + slug(projectName) + "-" + date.format(DateTimeFormatter.ISO_LOCAL_DATE) + ".pdf";
    }

    private static String money(NumberFormat format, BigDecimal amount) {
        return format.format(amount).replace('\u00a0', ' ').replace('\u202f', ' ');
    }

    private static String slug(String name) {
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        if (normalized.isEmpty()) return "obra";
        return normalized.substring(0, Math.min(100, normalized.length())).replaceAll("-$", "");
    }

    private static final class PageWriter implements AutoCloseable {
        private static final float MARGIN = 46;
        private final PDDocument document;
        private final PDFont normal;
        private final PDFont bold;
        private PDPageContentStream stream;
        private float y;
        private int pageNumber;

        private PageWriter(PDDocument document) throws IOException {
            this.document = document;
            // Liberation Sans is bundled and licensed for redistribution by PDFBox.
            try (InputStream font = PDDocument.class.getResourceAsStream("/org/apache/pdfbox/resources/ttf/LiberationSans-Regular.ttf")) {
                if (font == null) throw new IOException("Fonte do relatório não localizada");
                normal = PDType0Font.load(document, font);
                bold = normal;
            }
        }

        private void newPage() throws IOException {
            if (stream != null) stream.close();
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            stream = new PDPageContentStream(document, page);
            y = PDRectangle.A4.getHeight() - MARGIN;
            draw("ObraCerta | Relatório financeiro | Página " + ++pageNumber, bold, 10, y);
            y -= 28;
        }

        private void line(String text, boolean heading) throws IOException {
            PDFont font = heading ? bold : normal;
            float size = heading ? 12 : 10;
            String clean = text.replaceAll("\\s+", " ").trim();
            StringBuilder current = new StringBuilder();
            for (int offset = 0; offset < clean.length();) {
                int codepoint = clean.codePointAt(offset);
                offset += Character.charCount(codepoint);
                String character = new String(Character.toChars(codepoint));
                try { font.getStringWidth(character); }
                catch (IllegalArgumentException unsupported) {
                    throw new IOException("Caractere não suportado pela fonte do relatório: U+" + Integer.toHexString(codepoint), unsupported);
                }
                if (font.getStringWidth(current + character) / 1000 * size > PDRectangle.A4.getWidth() - 2 * MARGIN) {
                    write(current.toString(), font, size);
                    current.setLength(0);
                }
                current.append(character);
            }
            if (!current.isEmpty()) write(current.toString(), font, size);
            y -= 6;
        }

        private void write(String text, PDFont font, float size) throws IOException {
            if (stream == null || y < MARGIN + 16) newPage();
            draw(text, font, size, y);
            y -= 16;
        }

        private void draw(String text, PDFont font, float size, float baseline) throws IOException {
            stream.beginText();
            stream.setFont(font, size);
            stream.setNonStrokingColor(0f, 0.40f, 0.43f);
            stream.newLineAtOffset(MARGIN, baseline);
            stream.showText(text);
            stream.endText();
        }

        public void close() throws IOException { if (stream != null) stream.close(); }
    }
}
