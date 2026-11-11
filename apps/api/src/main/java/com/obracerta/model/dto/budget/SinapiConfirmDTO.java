package com.obracerta.model.dto.budget;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;

/**
 * Confirmação do lote SINAPI (US15). {@code unitCost} é o custo por m² exibido na prévia; o
 * servidor só grava se o custo consultado agora for igual a ele.
 */
public record SinapiConfirmDTO(
        @NotBlank String uf,
        @NotBlank String month,
        @NotBlank String projectType,
        @NotBlank String finishId,
        @NotNull @Positive(message = "Informe uma área positiva.") BigDecimal area,
        @NotNull @Positive(message = "Informe um custo unitário positivo.") BigDecimal unitCost,
        @Valid @NotEmpty List<SinapiCategoryShareDTO> percentages) {
}
