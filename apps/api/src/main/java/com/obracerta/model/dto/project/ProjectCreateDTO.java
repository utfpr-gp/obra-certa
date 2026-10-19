package com.obracerta.model.dto.project;

import com.obracerta.enums.ProjectType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProjectCreateDTO(
        @NotBlank @Size(min = 3, max = 255) String name,
        @NotNull ProjectType type,
        @Size(max = 255) String location
) {
}
