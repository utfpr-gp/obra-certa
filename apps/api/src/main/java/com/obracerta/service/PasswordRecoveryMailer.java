package com.obracerta.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URI;

@Service
public class PasswordRecoveryMailer {
    private final JavaMailSender sender;
    private final String from;
    private final String frontendUrl;

    public PasswordRecoveryMailer(JavaMailSender sender,
            @Value("${obracerta.password-recovery.from}") String from,
            @Value("${obracerta.frontend-url}") String frontendUrl) {
        URI uri = URI.create(frontendUrl);
        if (!uri.isAbsolute() || uri.getHost() == null || uri.getQuery() != null || uri.getFragment() != null
                || uri.getUserInfo() != null || !("https".equals(uri.getScheme())
                || ("http".equals(uri.getScheme()) && "localhost".equals(uri.getHost())))) {
            throw new IllegalArgumentException("FRONTEND_URL deve usar HTTPS ou http://localhost para desenvolvimento.");
        }
        this.sender = sender;
        this.from = from;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    public void send(String recipient, String token) {
        var message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(recipient);
        message.setSubject("ObraCerta — Redefinição de senha");
        message.setText("""
                Você solicitou a redefinição da senha da sua conta no ObraCerta.

                Abra o link abaixo para definir uma nova senha. Ele é válido por 30 minutos e pode ser usado uma única vez.

                %s/redefinir-senha#token=%s

                Se você não solicitou esta alteração, ignore este e-mail. Sua senha continua a mesma.
                """.formatted(frontendUrl, token));
        sender.send(message);
    }
}
