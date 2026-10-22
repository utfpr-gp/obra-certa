package com.obracerta.service;

import com.obracerta.model.dto.category.CategoryResponseDTO;
import com.obracerta.repository.ExpenseCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Collator;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class ExpenseCategoryService {

    private final ExpenseCategoryRepository expenseCategoryRepository;

    public ExpenseCategoryService(ExpenseCategoryRepository expenseCategoryRepository) {
        this.expenseCategoryRepository = expenseCategoryRepository;
    }

    /**
     * Leitura pura do catalogo de categorias. A ordenacao fica aqui (e nao no banco) para
     * que o Collator pt-BR seja testavel sem PostgreSQL.
     */
    @Transactional(readOnly = true)
    public List<CategoryResponseDTO> findAll() {
        Collator collator = Collator.getInstance(Locale.forLanguageTag("pt-BR"));
        collator.setStrength(Collator.PRIMARY);

        return expenseCategoryRepository.findAll().stream()
                .map(category -> new CategoryResponseDTO(category.getId(), category.getName()))
                .sorted(Comparator.comparing(CategoryResponseDTO::name, collator))
                .toList();
    }
}
