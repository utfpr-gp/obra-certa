package com.obracerta.controller;

import com.obracerta.model.dto.AuthDTO;
import com.obracerta.model.dto.LoginResponseDTO;
import com.obracerta.model.dto.RegisterUserDTO;
import com.obracerta.services.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login (@RequestBody @Valid AuthDTO authDTO){
        var token = this.authService.login(authDTO);
        return ResponseEntity.ok(new LoginResponseDTO(token));
    }

    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody @Valid RegisterUserDTO data){
        this.authService.register(data);
        return ResponseEntity.ok().build();
    }
}
