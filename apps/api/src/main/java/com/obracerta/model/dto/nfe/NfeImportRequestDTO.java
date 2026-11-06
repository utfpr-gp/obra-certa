package com.obracerta.model.dto.nfe;

import java.util.List;

public record NfeImportRequestDTO(List<Item> items, Payment payment) {

    // categoryId nulo é aceito aqui e tratado pelo service, que lista os itens sem categoria.
    public record Item(int itemNumber, String categoryId) {
    }

    // Parte opcional: ausente ou paid nulo valem true (checkbox "paga" marcado por padrão).
    public record Payment(Boolean paid) {
    }
}
