package com.obracerta.controller;

import com.obracerta.configuration.security.TokenService;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.model.dto.project.ProjectUpdateDTO;
import com.obracerta.repository.UserRepository;
import com.obracerta.service.ProjectService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Teste de contrato da fatia MVC: o {@code ProjectService} está mockado e os filtros de
 * segurança estão desligados, então o que se prova aqui é o mapeamento 404 para o payload
 * padrão de erro, não a posse da obra. A prova real de posse/Anti-IDOR está em
 * {@code ProjectAntiIdorIntegrationTest} e {@code ProjectLifecycleTest}.
 */
@WebMvcTest(ProjectController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProjectControllerTest {

    private static final String PROJECT_ID = "project-2";
    private static final String PROJECT_PATH = "/api/projects/" + PROJECT_ID;
    // Contrato único de idioma: a API responde 404 em português, conforme
    // ResourceNotFoundException e GlobalExceptionHandler.
    private static final String NOT_FOUND_MESSAGE = "Projeto não encontrado";
    private static final String VALID_UPDATE_BODY = """
            {"name":"Casa principal","type":"NEW_CONSTRUCTION","status":"IN_PROGRESS","location":"Rua A"}
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProjectService projectService;

    @MockBean
    private TokenService tokenService;

    @MockBean
    private UserRepository userRepository;

    @Test
    void returnsNotFoundWithoutExposingAnotherUsersProjectOnGet() throws Exception {
        when(projectService.findById(PROJECT_ID))
                .thenThrow(new ResourceNotFoundException());

        assertNotFoundPayload(mockMvc.perform(get(PROJECT_PATH)));
    }

    @Test
    void returnsNotFoundWithoutExposingAnotherUsersProjectOnPut() throws Exception {
        when(projectService.update(eq(PROJECT_ID), any(ProjectUpdateDTO.class)))
                .thenThrow(new ResourceNotFoundException());

        assertNotFoundPayload(mockMvc.perform(put(PROJECT_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .content(VALID_UPDATE_BODY)));
    }

    @Test
    void returnsNotFoundWithoutExposingAnotherUsersProjectOnDelete() throws Exception {
        doThrow(new ResourceNotFoundException())
                .when(projectService).delete(PROJECT_ID);

        assertNotFoundPayload(mockMvc.perform(delete(PROJECT_PATH)));
    }

    private void assertNotFoundPayload(ResultActions result) throws Exception {
        result.andExpect(status().isNotFound())
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value(NOT_FOUND_MESSAGE))
                .andExpect(jsonPath("$.path").value(PROJECT_PATH))
                .andExpect(jsonPath("$.fieldErrors").isEmpty())
                .andExpect(jsonPath("$.id").doesNotExist())
                .andExpect(jsonPath("$.userId").doesNotExist())
                .andExpect(jsonPath("$.name").doesNotExist())
                .andExpect(jsonPath("$.location").doesNotExist())
                .andExpect(jsonPath("$.deletedAt").doesNotExist())
                .andExpect(jsonPath("$.stackTrace").doesNotExist())
                .andExpect(jsonPath("$.trace").doesNotExist())
                .andExpect(jsonPath("$.exception").doesNotExist());
    }
}
