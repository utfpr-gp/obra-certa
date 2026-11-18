package com.obracerta.mapper;

import com.obracerta.model.dto.project.ProjectResponseDTO;
import com.obracerta.model.entity.Project;
import org.springframework.stereotype.Component;

@Component
public class ProjectMapper {

    public ProjectResponseDTO toResponse(Project project) {
        return new ProjectResponseDTO(
                project.getId(),
                project.getName(),
                project.getType(),
                project.getLocation(),
                project.getStatus(),
                project.getCreatedAt(),
                project.getUpdatedAt());
    }
}
