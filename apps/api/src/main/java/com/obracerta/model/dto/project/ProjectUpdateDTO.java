package com.obracerta.model.dto.project;

import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProjectUpdateDTO(
        @NotBlank(message = "Name is required and cannot be blank")
        @Size(min = 3, max = 255, message = "Name must contain between 3 and 255 characters")
        String name,
        @NotNull(message = "Type is required") ProjectType type,
        @NotNull(message = "Status is required") ProjectStatus status,
        @Size(max = 255, message = "Location must contain at most 255 characters") String location
) {
}
