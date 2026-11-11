package com.obracerta.model.dto.budget;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

/** Percentual de uma categoria no rateio, em percentual (ex.: 33.33 = 33,33%). */
public record SinapiCategoryShareDTO(
        @NotBlank String categoryId,
        @NotNull @PositiveOrZero(message = "Os percentuais devem ser não negativos.") BigDecimal percentage) {
}
