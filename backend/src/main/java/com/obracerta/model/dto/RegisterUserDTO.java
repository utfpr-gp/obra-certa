package com.obracerta.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterUserDTO(
        @NotBlank(message = "O nome é obrigatório") 
        String name, 
        
        @NotBlank(message = "O e-mail é obrigatório") 
        @Email(message = "O formato do e-mail é inválido") 
        String email, 
        
        @NotBlank(message = "A senha é obrigatória") 
        @Size(min = 6, message = "A senha deve conter no mínimo 6 caracteres")

        String password
) {}
