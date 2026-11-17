package com.obracerta.service;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PasswordRecoveryMailerTest {
    @Test
    void sendsTheConfiguredPublicLinkAndSender() {
        var sender = mock(JavaMailSender.class);
        var mailer = new PasswordRecoveryMailer(sender, "ObraCerta <suporte@example.com>", "https://example.com/");
        mailer.send("pessoa@example.com", "safe-token");

        var message = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(sender).send(message.capture());
        assertThat(message.getValue().getTo()).containsExactly("pessoa@example.com");
        assertThat(message.getValue().getFrom()).isEqualTo("ObraCerta <suporte@example.com>");
        assertThat(message.getValue().getText()).contains("https://example.com/redefinir-senha#token=safe-token", "30 minutos");
    }

    @Test
    void rejectsUntrustedFrontendUrlConfiguration() {
        assertThatThrownBy(() -> new PasswordRecoveryMailer(mock(JavaMailSender.class),
                "sender@example.com", "http://public.example.com")).isInstanceOf(IllegalArgumentException.class);
    }
}
