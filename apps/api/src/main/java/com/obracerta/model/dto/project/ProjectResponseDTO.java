package com.obracerta.model.dto.project;

import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;

import java.time.LocalDateTime;

public record ProjectResponseDTO(
        String id,
        String name,
        ProjectType type,
        String location,
        ProjectStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
