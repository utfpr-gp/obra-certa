package com.obracerta.controller;

import com.obracerta.service.PasswordRecoveryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.AssertTrue;
import java.nio.charset.StandardCharsets;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class PasswordRecoveryController {
    private final PasswordRecoveryService service;

    public PasswordRecoveryController(PasswordRecoveryService service) {
        this.service = service;
    }

    @PostMapping("/forgot-password")
    public void request(@RequestBody @Valid RecoveryRequest request) {
        service.request(request.email());
    }

    @PostMapping("/reset-password")
    public void reset(@RequestBody @Valid ResetRequest request) {
        service.reset(request.token(), request.password());
    }

    public record RecoveryRequest(@NotBlank @Email @Size(max = 255) String email) {}

    public record ResetRequest(@NotBlank @Size(max = 128) String token,
            @NotBlank @Size(min = 6, max = 72) String password) {
        @AssertTrue(message = "Escolha uma senha mais curta.")
        public boolean isPasswordWithinEncoderLimit() {
            return password == null || password.getBytes(StandardCharsets.UTF_8).length <= 72;
        }
    }
}
