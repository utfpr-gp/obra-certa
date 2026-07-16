package com.obracerta.model.dto;

import com.obracerta.model.entity.User;
import com.obracerta.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.BeanUtils;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {
    private String id;
    
    @NotBlank(message = "O nome é obrigatório")
    private String name;
    
    @NotBlank(message = "O e-mail é obrigatório")
    @Email(message = "O formato do e-mail é inválido")
    private String email;
    
    private UserRole userRole;
    private LocalDateTime createdAt;

    public UserDTO(User user){
        BeanUtils.copyProperties(user, this);
    }
}
