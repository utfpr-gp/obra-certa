package com.obracerta.model.dto;

import com.obracerta.enums.UserRole;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleDTO(
        @NotNull(message = "A Role usuário é obrigatório")
        UserRole role
) {}