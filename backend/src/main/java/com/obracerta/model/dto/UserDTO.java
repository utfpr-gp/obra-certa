package com.obracerta.model.dto;

import com.obracerta.model.entity.User;
import com.obracerta.model.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import org.springframework.beans.BeanUtils;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {
    private String id;
    private String name;
    private String email;
    private UserRole userRole;
    private LocalDateTime createdAt;

    public UserDTO(User user){
        BeanUtils.copyProperties(user, this);
    }
}
