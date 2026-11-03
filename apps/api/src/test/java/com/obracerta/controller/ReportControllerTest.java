package com.obracerta.controller;

import com.obracerta.model.dto.report.ReportResponseDTO;
import com.obracerta.model.dto.report.ReportCategoryDTO;
import com.obracerta.service.ReportService;
import com.obracerta.configuration.security.TokenService;
import com.obracerta.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.verify;
import com.obracerta.exception.ResourceNotFoundException;

@WebMvcTest(ReportController.class)
@AutoConfigureMockMvc(addFilters = false)
class ReportControllerTest {
    @Autowired MockMvc mockMvc;
    @MockBean ReportService reportService;
    @MockBean TokenService tokenService;
    @MockBean UserRepository userRepository;

    @Test
    void returnsPdfAttachmentAndFilename() throws Exception {
        when(reportService.exportPdf("project-1")).thenReturn(new com.obracerta.model.dto.report.ReportPdfDTO("relatorio-casa-2026-11-02.pdf", new byte[]{37, 80, 68, 70}));
        mockMvc.perform(get("/api/projects/project-1/reports/pdf"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Disposition", org.hamcrest.Matchers.containsString("relatorio-casa-2026-11-02.pdf")))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().bytes(new byte[]{37, 80, 68, 70}));
    }

    @Test
    void returnsNotFoundForForeignPdf() throws Exception {
        when(reportService.exportPdf("other")).thenThrow(new ResourceNotFoundException());
        mockMvc.perform(get("/api/projects/other/reports/pdf"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.message").value("Projeto não encontrado"));
    }

    @Test
    void returnsInternalVisualSnapshotWithoutAppendixAndPreservesNotFound() throws Exception {
        var report = new ReportResponseDTO("project-1", "Casa", BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, List.of());
        when(reportService.exportSnapshot("project-1")).thenReturn(new com.obracerta.model.dto.report.ReportExportDTO(report, "relatorio-casa-2026-11-02.pdf", "2026-11-02"));
        mockMvc.perform(get("/api/projects/project-1/reports/export"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.report.projectId").value("project-1"))
                .andExpect(jsonPath("$.filename").value("relatorio-casa-2026-11-02.pdf"))
                .andExpect(jsonPath("$.generatedAt").value("2026-11-02"))
                .andExpect(jsonPath("$.appendixPdf").doesNotExist());
        when(reportService.exportSnapshot("other")).thenThrow(new ResourceNotFoundException());
        mockMvc.perform(get("/api/projects/other/reports/export")).andExpect(status().isNotFound());
    }

    @Test
    void returnsDistributionJson() throws Exception {
        when(reportService.getReport(eq("project-1"))).thenReturn(new ReportResponseDTO(
                "project-1", "Minha obra", new BigDecimal("0.00"), new BigDecimal("10.00"),
                new BigDecimal("10.00"), new BigDecimal("0.00"),
                List.of(new ReportCategoryDTO("cat-1", "Alvenaria", new BigDecimal("10.00"),
                        new BigDecimal("20.00"),
                        new BigDecimal("100.0")))));

        mockMvc.perform(get("/api/projects/project-1/reports").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categories[0].categoryName").value("Alvenaria"))
                .andExpect(jsonPath("$.categories[0].amount").value(10.0))
                .andExpect(jsonPath("$.categories[0].plannedAmount").value(20.0))
                .andExpect(jsonPath("$.categories[0].percentage").value(100.0));
    }

    @Test
    void doesNotExposeAnUnauthorizedProject() throws Exception {
        when(reportService.getReport("project-1")).thenThrow(new ResourceNotFoundException());

        mockMvc.perform(get("/api/projects/project-1/reports"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Projeto não encontrado"));
        verify(reportService).getReport("project-1");
    }
}
