package com.obracerta.controller;

import com.obracerta.configuration.security.TokenService;
import com.obracerta.model.dto.category.CategoryResponseDTO;
import com.obracerta.repository.UserRepository;
import com.obracerta.service.ExpenseCategoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Contrato de leitura das categorias: o service esta mockado, entao o que se prova aqui
 * e o mapeamento da rota, o status 200 e o formato do array devolvido.
 */
@WebMvcTest(ExpenseCategoryController.class)
@AutoConfigureMockMvc(addFilters = false)
class ExpenseCategoryControllerTest {

    private static final String CATEGORIES_PATH = "/api/expense-categories";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ExpenseCategoryService expenseCategoryService;

    @MockBean
    private TokenService tokenService;

    @MockBean
    private UserRepository userRepository;

    @Test
    void returnsOkWithCategoriesAlreadyOrdered() throws Exception {
        when(expenseCategoryService.findAll()).thenReturn(List.of(
                new CategoryResponseDTO("cat-alvenaria", "Alvenaria"),
                new CategoryResponseDTO("cat-eletrica", "Elétrica")
        ));

        mockMvc.perform(get(CATEGORIES_PATH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value("cat-alvenaria"))
                .andExpect(jsonPath("$[0].name").value("Alvenaria"))
                .andExpect(jsonPath("$[1].id").value("cat-eletrica"))
                .andExpect(jsonPath("$[1].name").value("Elétrica"));
    }

    @Test
    void returnsOkWithEmptyArrayWhenThereAreNoCategories() throws Exception {
        when(expenseCategoryService.findAll()).thenReturn(List.of());

        mockMvc.perform(get(CATEGORIES_PATH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
