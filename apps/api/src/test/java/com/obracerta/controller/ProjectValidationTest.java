package com.obracerta.controller;

import com.obracerta.service.ProjectService;
import com.obracerta.configuration.security.TokenService;
import com.obracerta.repository.UserRepository;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.stream.Stream;

import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProjectController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProjectValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProjectService projectService;

    @MockBean
    private TokenService tokenService;

    @MockBean
    private UserRepository userRepository;

    @ParameterizedTest
    @MethodSource("invalidProjectRequests")
    void rejectsInvalidProjectSubmissionWithDescriptiveFieldErrors(
            String requestBody,
            String expectedField,
            String expectedMessage) throws Exception {
        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.path").value("/api/projects"))
                .andExpect(jsonPath("$.fieldErrors[*].field", hasItem(expectedField)))
                .andExpect(jsonPath("$.fieldErrors[*].message", hasItem(expectedMessage)));

        verifyNoInteractions(projectService);
    }

    private static Stream<Arguments> invalidProjectRequests() {
        return Stream.of(
                Arguments.of(
                        "{\"name\":\"   \",\"type\":\"RENOVATION\",\"location\":\"Rua A\"}",
                        "name",
                        "Name is required and cannot be blank"),
                Arguments.of(
                        "{\"name\":\"AB\",\"type\":\"RENOVATION\",\"location\":\"Rua A\"}",
                        "name",
                        "Name must contain between 3 and 255 characters"),
                Arguments.of(
                        "{\"name\":\"Valid project\",\"location\":\"Rua A\"}",
                        "type",
                        "Type is required")
        );
    }
}
