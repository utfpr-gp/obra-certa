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
