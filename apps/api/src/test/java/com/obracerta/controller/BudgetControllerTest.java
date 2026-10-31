package com.obracerta.controller;

import com.obracerta.configuration.security.TokenService;
import com.obracerta.enums.BudgetState;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.exception.BudgetBelowSpentException;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import com.obracerta.model.dto.budget.BudgetCategoryDTO;
import com.obracerta.model.dto.budget.BudgetSetDTO;
import com.obracerta.repository.UserRepository;
import com.obracerta.service.BudgetService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Teste de contrato da fatia MVC do orcamento: o {@code BudgetService} esta mockado e os
 * filtros de seguranca estao desligados. O que se prova aqui e o mapeamento HTTP do
 * upsert (200 com o DTO recalculado) e a traducao dos dois 404 no payload padrao de erro.
 */
@WebMvcTest(BudgetController.class)
@AutoConfigureMockMvc(addFilters = false)
class BudgetControllerTest {

    private static final String PROJECT_ID = "project-1";
    private static final String CATEGORY_ID = "cat-alvenaria";
    private static final String BUDGET_PATH =
            "/api/budgets/" + PROJECT_ID + "/categories/" + CATEGORY_ID;
    private static final String VALID_BODY = """
            {"estimatedAmount":1500.00}
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BudgetService budgetService;

    @MockBean
    private TokenService tokenService;

    @MockBean
    private UserRepository userRepository;

    @Test
    void returnsTheRecalculatedCategoryOnPut() throws Exception {
        when(budgetService.setBudget(eq(PROJECT_ID), eq(CATEGORY_ID), any(BudgetSetDTO.class)))
                .thenReturn(new BudgetCategoryDTO(
                        CATEGORY_ID,
                        "Alvenaria",
                        new BigDecimal("1500.00"),
                        new BigDecimal("200.00"),
                        new BigDecimal("1300.00"),
                        new BigDecimal("13.3"),
                        BudgetState.ON_TRACK,
                        true));

        mockMvc.perform(put(BUDGET_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryId").value(CATEGORY_ID))
                .andExpect(jsonPath("$.categoryName").value("Alvenaria"))
                .andExpect(jsonPath("$.plannedAmount").value(1500.00))
                .andExpect(jsonPath("$.spentAmount").value(200.00))
                .andExpect(jsonPath("$.balanceAmount").value(1300.00))
                .andExpect(jsonPath("$.percentage").value(13.3))
                .andExpect(jsonPath("$.state").value("ON_TRACK"))
                .andExpect(jsonPath("$.hasBudget").value(true));
    }

    @Test
    void returnsTheZeroedCategoryOnPost() throws Exception {
        when(budgetService.zeroBudget(PROJECT_ID, CATEGORY_ID))
                .thenReturn(new BudgetCategoryDTO(
                        CATEGORY_ID,
                        "Alvenaria",
                        new BigDecimal("0.00"),
                        new BigDecimal("200.00"),
                        new BigDecimal("-200.00"),
                        null,
                        BudgetState.NO_BUDGET,
                        true));

        mockMvc.perform(post(BUDGET_PATH + "/zero"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryId").value(CATEGORY_ID))
                .andExpect(jsonPath("$.categoryName").value("Alvenaria"))
                .andExpect(jsonPath("$.plannedAmount").value(0.00))
                .andExpect(jsonPath("$.spentAmount").value(200.00))
                .andExpect(jsonPath("$.balanceAmount").value(-200.00))
                .andExpect(jsonPath("$.percentage").value(nullValue()))
                .andExpect(jsonPath("$.state").value("NO_BUDGET"))
                .andExpect(jsonPath("$.hasBudget").value(true));
    }

    @Test
    void returnsNotFoundWithoutExposingAnotherUsersProjectOnPut() throws Exception {
        when(budgetService.setBudget(eq(PROJECT_ID), eq(CATEGORY_ID), any(BudgetSetDTO.class)))
                .thenThrow(new ResourceNotFoundException());

        assertNotFoundPayload(
                mockMvc.perform(put(BUDGET_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY)),
                "Projeto não encontrado");
    }

    @Test
    void returnsNotFoundWithoutExposingAnUnknownCategoryOnPut() throws Exception {
        when(budgetService.setBudget(eq(PROJECT_ID), eq(CATEGORY_ID), any(BudgetSetDTO.class)))
                .thenThrow(new ResourceNotFoundException("Categoria não encontrada"));

        assertNotFoundPayload(
                mockMvc.perform(put(BUDGET_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY)),
                "Categoria não encontrada");
    }

    @ParameterizedTest
    @ValueSource(strings = {"Categoria não encontrada", "Orçamento não encontrado", "Projeto não encontrado"})
    void returnsNotFoundInStandardPayloadOnZero(String message) throws Exception {
        when(budgetService.zeroBudget(PROJECT_ID, CATEGORY_ID))
                .thenThrow(new ResourceNotFoundException(message));

        assertNotFoundPayload(mockMvc.perform(post(BUDGET_PATH + "/zero")), message, BUDGET_PATH + "/zero");
    }

    @ParameterizedTest
    @ValueSource(strings = {"null", "0", "-1", "1.234"})
    void rejectsInvalidAmountsBeforeCallingService(String amount) throws Exception {
        mockMvc.perform(put(BUDGET_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estimatedAmount\":" + amount + "}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("estimatedAmount"))
                .andExpect(jsonPath("$.fieldErrors[0].message")
                        .value("Informe um valor positivo com até duas casas decimais."));
        verifyNoInteractions(budgetService);
    }

    @Test
    void returnsConflictWithFormattedSpentTotalInStandardPayload() throws Exception {
        when(budgetService.setBudget(eq(PROJECT_ID), eq(CATEGORY_ID), any(BudgetSetDTO.class)))
                .thenThrow(new BudgetBelowSpentException(new BigDecimal("2345.67")));

        mockMvc.perform(put(BUDGET_PATH).contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value(
                        "O orçamento não pode ser menor do que o total de despesas já realizadas nesta categoria: R$ 2.345,67"))
                .andExpect(jsonPath("$.path").value(BUDGET_PATH))
                .andExpect(jsonPath("$.fieldErrors").isEmpty());
    }

    private void assertNotFoundPayload(ResultActions result, String message) throws Exception {
        assertNotFoundPayload(result, message, BUDGET_PATH);
    }

    private void assertNotFoundPayload(ResultActions result, String message, String path) throws Exception {
        result.andExpect(status().isNotFound())
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value(message))
                .andExpect(jsonPath("$.path").value(path))
                .andExpect(jsonPath("$.fieldErrors").isEmpty())
                .andExpect(jsonPath("$.categoryId").doesNotExist())
                .andExpect(jsonPath("$.plannedAmount").doesNotExist())
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }
}
