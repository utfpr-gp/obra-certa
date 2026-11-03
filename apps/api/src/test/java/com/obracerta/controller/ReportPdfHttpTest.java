package com.obracerta.controller;

import com.obracerta.configuration.security.SecurityConfigurations;
import com.obracerta.configuration.security.TokenService;
import com.obracerta.model.dto.report.ReportResponseDTO;
import com.obracerta.model.entity.User;
import com.obracerta.repository.UserRepository;
import com.obracerta.service.ReportPdfService;
import com.obracerta.service.ReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ReportController.class)
@Import(SecurityConfigurations.class)
class ReportPdfHttpTest {
    @Autowired MockMvc mockMvc;
    @MockBean ReportService reportService;
    @MockBean TokenService tokenService;
    @MockBean UserRepository userRepository;

    private final ReportPdfService pdfService = new ReportPdfService(
            Clock.fixed(Instant.parse("2026-11-02T15:30:00Z"), ZoneOffset.UTC));

    @BeforeEach
    void authenticate() {
        when(tokenService.validateToken("valid-token")).thenReturn("owner@example.com");
        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(new User("Owner", "owner@example.com", "unused")));
    }

    @Test
    void returnsStructured500ForRealGeneratorFailureWithoutExposingInputOrLosingAuthentication() throws Exception {
        when(reportService.exportPdf("project-1")).thenAnswer(invocation ->
                pdfService.generate(report("Private project 😀"), List.of()));

        mockMvc.perform(get("/api/projects/project-1/reports/pdf")
                        .header("Authorization", "Bearer valid-token")
                        .header("Origin", "http://localhost:4200"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.error").value("Internal Server Error"))
                .andExpect(jsonPath("$.message").value("Não foi possível gerar o PDF."))
                .andExpect(jsonPath("$.path").value("/api/projects/project-1/reports/pdf"))
                .andExpect(jsonPath("$.fieldErrors").isEmpty())
                .andExpect(content().string(not(containsString("Private project"))))
                .andExpect(content().string(not(containsString("U+"))))
                .andExpect(content().string(not(containsString("exception"))));

        when(reportService.getReport("project-1")).thenReturn(report("Casa"));
        mockMvc.perform(get("/api/projects/project-1/reports")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk());
    }

    @Test
    void exposesDatedProjectFilenameToDevelopmentOrigin() throws Exception {
        when(reportService.exportPdf("project-1")).thenAnswer(invocation ->
                pdfService.generate(report("Reforma São João"), List.of()));

        mockMvc.perform(get("/api/projects/project-1/reports/pdf")
                        .header("Authorization", "Bearer valid-token")
                        .header("Origin", "http://localhost:4200"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"))
                .andExpect(header().string("Access-Control-Expose-Headers", "Content-Disposition"))
                .andExpect(header().string("Content-Disposition",
                        "attachment; filename=\"relatorio-reforma-sao-joao-2026-11-02.pdf\""));
    }

    private ReportResponseDTO report(String name) {
        return new ReportResponseDTO("project-1", name, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, List.of());
    }
}
