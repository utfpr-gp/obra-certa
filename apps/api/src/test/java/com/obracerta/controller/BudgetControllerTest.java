package com.obracerta.controller;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;
import ch.qos.logback.core.read.ListAppender;
import com.obracerta.configuration.security.TokenService;
import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.BudgetState;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.exception.BudgetBelowSpentException;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.slf4j.LoggerFactory;
import com.obracerta.model.dto.budget.BudgetCategoryDTO;
import com.obracerta.model.dto.budget.BudgetSetDTO;
import com.obracerta.repository.UserRepository;
import com.obracerta.repository.ProjectRepository;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.User;
import com.obracerta.service.SinapiReferenceService;
import com.obracerta.service.SidraClient;
import com.obracerta.service.BudgetService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.math.BigDecimal;
import java.net.SocketTimeoutException;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;

/**
 * Teste de contrato da fatia MVC do orcamento: o {@code BudgetService} esta mockado e os
 * filtros de seguranca estao desligados. O que se prova aqui e o mapeamento HTTP do
 * upsert (200 com o DTO recalculado) e a traducao dos dois 404 no payload padrao de erro.
 */
@WebMvcTest(BudgetController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({SinapiReferenceService.class, BudgetControllerTest.SidraTestConfiguration.class})
class BudgetControllerTest {

    private static final String PROJECT_ID = "project-1";
    private static final String CATEGORY_ID = "cat-alvenaria";
    private static final String BUDGET_PATH =
            "/api/budgets/" + PROJECT_ID + "/categories/" + CATEGORY_ID;
    private static final String SINAPI_PATH = "/api/budgets/" + PROJECT_ID + "/sinapi/references";
    private static final String SIDRA_URL = "https://api.sidra.ibge.gov.br/values/t/647/n3/41/v/51/p/202609/c314/7090/c41/786,787,788,789";
    private static final String SIDRA_URL_1998 = "https://api.sidra.ibge.gov.br/values/t/647/n3/41/v/51/p/199807/c314/7090/c41/786,787,788,789";
    private static final String SIDRA_HEADER =
            """
            {"NC":"Nível Territorial (Código)","NN":"Nível Territorial",
            "MC":"Unidade de Medida (Código)","MN":"Unidade de Medida","V":"Valor",
            "D1C":"Unidade da Federação (Código)","D1N":"Unidade da Federação",
            "D2C":"Variável (Código)","D2N":"Variável","D3C":"Mês (Código)","D3N":"Mês",
            "D4C":"Projeto (Código)","D4N":"Projeto",
            "D5C":"Padrão de acabamento (Código)","D5N":"Padrão de acabamento"}
            """;
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

    @MockBean
    private ProjectRepository projectRepository;

    @MockBean
    private UserContextHelper userContextHelper;

    @Autowired
    private MockRestServiceServer sidra;

    @TestConfiguration
    static class SidraTestConfiguration {
        private final RestClient.Builder builder = RestClient.builder();

        @Bean
        MockRestServiceServer sidra() {
            return MockRestServiceServer.bindTo(builder).build();
        }

        @Bean
        SidraClient sidraClient(MockRestServiceServer sidra) {
            return new SidraClient(builder.build());
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"uf=XX&month=2026-09&projectType=7090",
            "uf=PR&month=2026-13&projectType=7090", "uf=PR&month=2026-9&projectType=7090",
            "uf=PR&month=2026-09&projectType=9999", "uf=PR&month=2026-09"})
    void rejectsInvalidSinapiParameters(String query) throws Exception {
        sidra.reset();
        mockMvc.perform(get(SINAPI_PATH + "?" + query))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(projectRepository);
        sidra.verify();
    }

    @Test
    void hidesForeignProjectBeforeCallingSidra() throws Exception {
        sidra.reset();
        when(userContextHelper.getAuthenticatedUser()).thenReturn(User.builder().id("owner").build());
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull(PROJECT_ID, "owner"))
                .thenReturn(Optional.empty());

        requestSinapi().andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Projeto não encontrado"));
        sidra.verify();
    }

    @Test
    void readsOnlyMatchingDimensionsAndPositiveCosts() throws Exception {
        allowSinapi();
        String body = """
                [%s,
                {"D1C":"41","D2C":"51","D3C":"202609","D4C":"7090","D5C":"787","D5N":"Normal","V":"2221.06"},
                {"D1C":"41","D2C":"51","D3C":"202609","D4C":"7090","D5C":"786","D5N":"Baixo","V":"-"},
                {"D1C":"41","D2C":"51","D3C":"202609","D4C":"7090","D5C":"788","D5N":"Alto","V":"0"},
                {"D1C":"41","D2C":"51","D3C":"202609","D4C":"7090","D5C":"789","D5N":"Mínimo","V":"-10.01"},
                {"D1C":"35","D2C":"51","D3C":"202609","D4C":"7090","D5C":"786","D5N":"Baixo","V":"100"},
                {"D1C":"41","D2C":"50","D3C":"202609","D4C":"7090","D5C":"786","D5N":"Baixo","V":"100"},
                {"D1C":"41","D2C":"51","D3C":"202610","D4C":"7090","D5C":"786","D5N":"Baixo","V":"100"},
                {"D1C":"41","D2C":"51","D3C":"202609","D4C":"7089","D5C":"786","D5N":"Baixo","V":"100"},
                {"D1C":"41","D2C":"51","D3C":"202609","D4C":"7090","D5C":"123","D5N":"Outro","V":"100"}]
                """.formatted(SIDRA_HEADER);
        sidra.expect(requestTo(SIDRA_URL)).andRespond(withSuccess(body, MediaType.APPLICATION_JSON));

        requestSinapi().andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.source").value("SIDRA/IBGE"))
                .andExpect(jsonPath("$.finishes.length()").value(1))
                .andExpect(jsonPath("$.finishes[0].id").value("787"))
                .andExpect(jsonPath("$.finishes[0].name").value("Normal"))
                .andExpect(jsonPath("$.finishes[0].unitCost").value(2221.06));
        sidra.verify();
    }

    @Test
    void returnsEmptyFinishesWithoutSidraData() throws Exception {
        allowSinapi();
        sidra.expect(requestTo(SIDRA_URL))
                .andRespond(withSuccess("[" + SIDRA_HEADER + "]", MediaType.APPLICATION_JSON));

        requestSinapi().andExpect(status().isOk()).andExpect(jsonPath("$.finishes").isEmpty());
        sidra.verify();
    }

    @Test
    void turnsSidraTimeoutIntoTemporaryError() throws Exception {
        allowSinapi();
        sidra.expect(requestTo(SIDRA_URL)).andRespond(withException(new SocketTimeoutException("read timed out")));

        requestSinapi().andExpect(status().isServiceUnavailable())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.status").value(503));
        sidra.verify();
    }

    @ParameterizedTest
    @ValueSource(strings = {"[]", "[{\"error\":\"temporarily unavailable\"}]",
            "[{\"V\":\"Valor\",\"D5N\":\"Padrão de acabamento\"}]"})
    void turnsIncompatibleSidraResponseIntoTemporaryError(String body) throws Exception {
        allowSinapi();
        sidra.expect(requestTo(SIDRA_URL)).andRespond(withSuccess(body, MediaType.APPLICATION_JSON));

        requestSinapi().andExpect(status().isServiceUnavailable())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.status").value(503));
        sidra.verify();
    }

    private void allowSinapi() {
        sidra.reset();
        when(userContextHelper.getAuthenticatedUser()).thenReturn(User.builder().id("owner").build());
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull(PROJECT_ID, "owner"))
                .thenReturn(Optional.of(Project.builder().id(PROJECT_ID).build()));
    }

    @Test
    void invalidSinapiParametersReturnBadRequestWithNoStore() throws Exception {
        sidra.reset();

        mockMvc.perform(get(SINAPI_PATH).param("uf", "XX").param("month", "2026-09")
                        .param("projectType", "7090"))
                .andExpect(status().isBadRequest())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.status").value(400));
        sidra.verify();
    }

    @Test
    void foreignProjectReturnsNotFoundWithNoStore() throws Exception {
        sidra.reset();
        when(userContextHelper.getAuthenticatedUser()).thenReturn(User.builder().id("owner").build());
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull(PROJECT_ID, "owner"))
                .thenReturn(Optional.empty());

        requestSinapi().andExpect(status().isNotFound())
                .andExpect(header().string("Cache-Control", "no-store"));
        sidra.verify();
    }

    @Test
    void sinapiLookupDoesNotWriteTheQueryDataToTheLogs() throws Exception {
        String sentinel = "Sentinela de captura do fluxo SINAPI";
        Logger root = (Logger) LoggerFactory.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME);
        Logger applicationLogger = (Logger) LoggerFactory.getLogger("com.obracerta");
        Level previousLevel = applicationLogger.getLevel();
        ListAppender<ILoggingEvent> captured = new ListAppender<>();
        captured.start();
        root.addAppender(captured);
        try {
            applicationLogger.setLevel(Level.TRACE);
            applicationLogger.trace(sentinel);
            allowSinapi();
            String body = """
                    [%s,
                    {"D1C":"41","D2C":"51","D3C":"199807","D4C":"7090","D5C":"787","D5N":"AcabamentoSigilosoXYZ","V":"4321.99"}]
                    """.formatted(SIDRA_HEADER);
            sidra.expect(requestTo(SIDRA_URL_1998)).andRespond(withSuccess(body, MediaType.APPLICATION_JSON));

            mockMvc.perform(get(SINAPI_PATH).param("uf", "PR").param("month", "1998-07")
                            .param("projectType", "7090"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.finishes[0].unitCost").value(4321.99));
            sidra.verify();
        } finally {
            applicationLogger.setLevel(previousLevel);
            root.detachAppender(captured);
            captured.stop();
        }

        String logs = captured.list.stream()
                .map(event -> {
                    IThrowableProxy throwable = event.getThrowableProxy();
                    return throwable == null ? event.getFormattedMessage()
                            : event.getFormattedMessage() + "\n" + throwable.getMessage();
                })
                .collect(Collectors.joining("\n"));
        assertThat(logs)
                .as("a resposta da fonte e os parâmetros da consulta não podem aparecer nos logs")
                .contains(sentinel)
                .doesNotContain("4321.99")
                .doesNotContain("AcabamentoSigilosoXYZ")
                .doesNotContain("199807")
                .doesNotContain("1998-07");
    }

    private ResultActions requestSinapi() throws Exception {
        return mockMvc.perform(get(SINAPI_PATH).param("uf", "PR")
                .param("month", "2026-09").param("projectType", "7090"));
    }

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

    private static final String CONFIRM_PATH = "/api/budgets/" + PROJECT_ID + "/sinapi/confirm";
    private static final String CONFIRM_BODY = """
            {"uf":"PR","month":"2026-09","projectType":"7090","finishId":"787","area":100,
             "unitCost":2221.06,"percentages":[{"categoryId":"cat-alvenaria","percentage":14}]}
            """;

    @Test
    void confirmSinapiReturnsOkWithNoStore() throws Exception {
        when(budgetService.confirmSinapi(eq(PROJECT_ID), any()))
                .thenReturn(new com.obracerta.model.dto.budget.SinapiConfirmationDTO(
                        java.util.List.of(new com.obracerta.model.dto.budget.SinapiConfirmationDTO.Created(
                                CATEGORY_ID, "Alvenaria", new BigDecimal("310.97"))),
                        java.util.List.of()));

        mockMvc.perform(post(CONFIRM_PATH).contentType(MediaType.APPLICATION_JSON).content(CONFIRM_BODY))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.created[0].categoryId").value(CATEGORY_ID))
                .andExpect(jsonPath("$.created[0].amount").value(310.97));
    }

    @Test
    void confirmSinapiInvalidBodyReturnsBadRequestWithNoStoreBeforeService() throws Exception {
        mockMvc.perform(post(CONFIRM_PATH).contentType(MediaType.APPLICATION_JSON)
                        .content(CONFIRM_BODY.replace("2221.06", "-1")))
                .andExpect(status().isBadRequest())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("unitCost"));
        verifyNoInteractions(budgetService);
    }

    @Test
    void confirmSinapiConflictReturnsConflictWithNoStore() throws Exception {
        when(budgetService.confirmSinapi(eq(PROJECT_ID), any()))
                .thenThrow(new com.obracerta.exception.SinapiReferenceException(
                        org.springframework.http.HttpStatus.CONFLICT, "O custo mudou desde a prévia."));

        mockMvc.perform(post(CONFIRM_PATH).contentType(MediaType.APPLICATION_JSON).content(CONFIRM_BODY))
                .andExpect(status().isConflict())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.message").value("O custo mudou desde a prévia."));
    }

    @Test
    void putInvalidBodyKeepsItsResponseWithoutNoStore() throws Exception {
        mockMvc.perform(put(BUDGET_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estimatedAmount\":-1}"))
                .andExpect(status().isBadRequest())
                .andExpect(header().doesNotExist("Cache-Control"));
        verifyNoInteractions(budgetService);
    }

    @Test
    void confirmSinapiMalformedJsonReturnsBadRequestWithNoStore() throws Exception {
        mockMvc.perform(post(CONFIRM_PATH).contentType(MediaType.APPLICATION_JSON).content("{\"uf\":"))
                .andExpect(status().isBadRequest())
                .andExpect(header().string("Cache-Control", "no-store"));
        verifyNoInteractions(budgetService);
    }

    @Test
    void confirmSinapiSidraFailureReturnsServiceUnavailableWithNoStore() throws Exception {
        when(budgetService.confirmSinapi(eq(PROJECT_ID), any()))
                .thenThrow(new com.obracerta.exception.SinapiReferenceException(
                        org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                        "O SIDRA/IBGE está temporariamente indisponível. Tente novamente."));

        mockMvc.perform(post(CONFIRM_PATH).contentType(MediaType.APPLICATION_JSON).content(CONFIRM_BODY))
                .andExpect(status().isServiceUnavailable())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.status").value(503));
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
