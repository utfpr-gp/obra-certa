package com.obracerta.model.dto.budget;

import java.math.BigDecimal;
import java.util.List;

/** Resultado da gravação: tetos criados e categorias cujo teto ativo foi preservado. */
public record SinapiConfirmationDTO(List<Created> created, List<Preserved> preserved) {

    public record Created(String categoryId, String categoryName, BigDecimal amount) {
    }

    public record Preserved(String categoryId, String categoryName) {
    }
}
