package com.obracerta.obracerta_backend;

import org.springframework.boot.SpringApplication;

public class TestObracertaBackendApplication {

	public static void main(String[] args) {
		SpringApplication.from(ObracertaBackendApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
