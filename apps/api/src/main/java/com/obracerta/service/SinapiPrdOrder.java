package com.obracerta.service;

import java.util.List;

/**
 * Ordem de referência das categorias da US15 (docs/prd.md, "Percentuais iniciais"). É a fonte
 * única da ordem no back: a confirmação recusa rateios fora dela, e o desempate do
 * {@link SinapiAllocationCalculator} depende da posição na lista recebida.
 */
final class SinapiPrdOrder {

    static final List<String> CATEGORY_NAMES = List.of(
            "Fundação e Estrutura",
            "Alvenaria",
            "Elétrica",
            "Hidráulica",
            "Telhado e Cobertura",
            "Esquadrias e Vidros",
            "Acabamento e Pintura",
            "Mão de Obra",
            "Taxas e Serviços");

    private SinapiPrdOrder() {
    }

    /** Posição da categoria na tabela do PRD, ou -1 se ela não estiver nela. */
    static int position(String categoryName) {
        return CATEGORY_NAMES.indexOf(categoryName);
    }
}
