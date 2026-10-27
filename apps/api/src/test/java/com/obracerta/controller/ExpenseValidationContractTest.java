package com.obracerta.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.exception.GlobalExceptionHandler;
import com.obracerta.model.entity.*;
import com.obracerta.repository.*;
import com.obracerta.service.ExpenseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.Optional;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;

class ExpenseValidationContractTest {
    MockMvc mvc;
    SupplierRepository suppliers;
    ExpenseRepository expenses;
    final ObjectMapper json = new ObjectMapper();

    @BeforeEach void setup() {
        var identity = mock(UserContextHelper.class);
        var projects = mock(ProjectRepository.class);
        var categories = mock(ExpenseCategoryRepository.class);
        suppliers = mock(SupplierRepository.class);
        expenses = mock(ExpenseRepository.class);
        var owner = User.builder().id("owner").build();
        when(identity.getAuthenticatedUser()).thenReturn(owner);
        when(projects.findByIdAndUserIdAndDeletedAtIsNull("project","owner"))
                .thenReturn(Optional.of(Project.builder().id("project").user(owner).build()));
        when(categories.findById("category"))
                .thenReturn(Optional.of(ExpenseCategory.builder().id("category").build()));
        var service = new ExpenseService(identity, projects, categories, suppliers, mock(BudgetRepository.class), expenses);
        mvc = MockMvcBuilders.standaloneSetup(new ExpenseController(service))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @ParameterizedTest
    @ValueSource(strings={"zero", "precision", "mode", "supplier", "calculatedZero"})
    void domainValidationUsesStandardErrorContractWithoutWriting(String invalidCase) throws Exception {
        var body = json.createObjectNode().put("projectId","project").put("categoryId","category")
                .put("description","Cimento").put("purchaseDate","2030-01-01").put("paid",true)
                .put("valueMode","DIRECT").put("totalPrice",100.25);
        body.putObject("newSupplier").put("name","Loja").put("document","12345678000190");
        switch (invalidCase) {
            case "zero" -> body.put("totalPrice",0);
            case "precision" -> body.put("totalPrice",1.234);
            case "mode" -> body.put("valueMode","UNKNOWN");
            case "supplier" -> body.put("supplierId","any");
            case "calculatedZero" -> body.put("valueMode","CALCULATED").put("quantity",0.01).put("unitPrice",0.01);
        }
        mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(APPLICATION_JSON))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.path").value("/api/expenses"))
                .andExpect(jsonPath("$.fieldErrors").isArray());
        verifyNoInteractions(expenses);
        verify(suppliers, never()).save(any());
    }
}
