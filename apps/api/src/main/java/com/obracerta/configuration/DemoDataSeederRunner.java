package com.obracerta.configuration;

import com.obracerta.service.DemoDataSeederService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Dispara o seed de demonstracao uma unica vez na subida da API.
 *
 * <p>So existe no perfil dev e apenas com {@code obracerta.seed.enabled=true}
 * (env {@code SEED_ENABLED}). A decisao de semear ou nao fica no service; aqui apenas
 * lemos a senha crua, delegamos e registramos que o seed rodou, nunca a senha.
 */
@Component
@Profile("dev")
@ConditionalOnProperty(
        prefix = "obracerta.seed",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = false)
public class DemoDataSeederRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeederRunner.class);

    private final DemoDataSeederService demoDataSeederService;
    private final String rawPassword;

    public DemoDataSeederRunner(
            DemoDataSeederService demoDataSeederService,
            @Value("${obracerta.seed.password}") String rawPassword) {
        this.demoDataSeederService = demoDataSeederService;
        this.rawPassword = rawPassword;
    }

    @Override
    public void run(String... args) {
        demoDataSeederService.seed(rawPassword);
        log.info("Seed de demonstracao conferido: usuario, obra, orcamentos e despesas demo prontos.");
    }
}
