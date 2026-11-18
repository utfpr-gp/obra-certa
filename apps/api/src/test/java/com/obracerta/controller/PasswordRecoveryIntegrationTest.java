package com.obracerta.controller;

import com.obracerta.model.entity.User;
import com.obracerta.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class PasswordRecoveryIntegrationTest {
    @Autowired private MockMvc mvc;
    @Autowired private UserRepository users;
    @Autowired private PasswordEncoder encoder;
    @Autowired private org.springframework.jdbc.core.JdbcTemplate jdbc;
    @MockBean private JavaMailSender sender;

    @Test
    void requestsLinkAnonymouslyAndLogsInWithTheNewPassword() throws Exception {
        String email = UUID.randomUUID() + "@example.com";
        users.saveAndFlush(new User("Pessoa", email, encoder.encode("senhaAntiga")));
        var inbox = new LinkedBlockingQueue<SimpleMailMessage>();
        doAnswer(invocation -> {
            inbox.add(invocation.getArgument(0));
            return null;
        }).when(sender).send(any(SimpleMailMessage.class));

        mvc.perform(post("/api/auth/forgot-password").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isOk());
        SimpleMailMessage message = inbox.poll(10, TimeUnit.SECONDS);
        assertThat(message).isNotNull();
        String token = message.getText().split("#token=")[1].split("\\s")[0];
        String payload = "{\"token\":\"" + token + "\",\"password\":\"senhaNova123\"}";
        org.awaitility.Awaitility.await().atMost(java.time.Duration.ofSeconds(5)).until(() ->
                jdbc.queryForObject("select count(*) from password_recovery_tokens t join users u on u.id = t.user_id where u.email = ?",
                        Integer.class, email) == 1);
        mvc.perform(post("/api/auth/reset-password").contentType(APPLICATION_JSON).content(payload))
                .andExpect(status().isOk());
        mvc.perform(post("/api/auth/login").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"senhaNova123\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.token").isString());
        assertThat(encoder.matches("senhaAntiga", users.findByEmail(email).orElseThrow().getPassword())).isFalse();
        mvc.perform(post("/api/auth/reset-password").contentType(APPLICATION_JSON).content(payload))
                .andExpect(status().isBadRequest());
    }
}
