package com.obracerta.model.dto.budget;

import java.math.BigDecimal;
import java.util.List;

public record SinapiReferencesDTO(String source, List<Finish> finishes) {
    public record Finish(String id, String name, BigDecimal unitCost) {
    }
}
