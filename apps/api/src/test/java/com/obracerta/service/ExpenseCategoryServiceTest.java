package com.obracerta.service;

import com.obracerta.model.dto.category.CategoryResponseDTO;
import com.obracerta.model.entity.ExpenseCategory;
import com.obracerta.repository.ExpenseCategoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseCategoryServiceTest {

    @Mock
    private ExpenseCategoryRepository expenseCategoryRepository;

    @InjectMocks
    private ExpenseCategoryService expenseCategoryService;

    @Test
    void ordersCategoriesAccordingToPtBrCollation() {
        when(expenseCategoryRepository.findAll()).thenReturn(List.of(
                category("cat-telhado", "Telhado e Cobertura"),
                category("cat-alvenaria", "Alvenaria"),
                category("cat-agua", "Água e Esgoto"),
                category("cat-eletrica", "Elétrica"),
                category("cat-fundacao", "Fundação e Estrutura"),
                category("cat-mao-de-obra", "Mão de Obra")
        ));

        // "Água e Esgoto" sobe para a primeira posicao com o Collator pt-BR; na ordem
        // natural de Java (por code point) o "Á" cairia depois de "Telhado".
        assertThat(expenseCategoryService.findAll())
                .extracting(CategoryResponseDTO::name)
                .containsExactly(
                        "Água e Esgoto",
                        "Alvenaria",
                        "Elétrica",
                        "Fundação e Estrutura",
                        "Mão de Obra",
                        "Telhado e Cobertura");
    }

    @Test
    void mapsEveryCategoryToTheResponseContract() {
        when(expenseCategoryRepository.findAll())
                .thenReturn(List.of(category("cat-alvenaria", "Alvenaria")));

        assertThat(expenseCategoryService.findAll())
                .containsExactly(new CategoryResponseDTO("cat-alvenaria", "Alvenaria"));
    }

    @Test
    void returnsEmptyListWhenThereAreNoCategories() {
        when(expenseCategoryRepository.findAll()).thenReturn(List.of());

        assertThat(expenseCategoryService.findAll()).isEmpty();
    }

    private static ExpenseCategory category(String id, String name) {
        return ExpenseCategory.builder().id(id).name(name).build();
    }
}
