package com.obracerta.service;

import com.obracerta.enums.ProjectType;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.mapper.ProjectMapper;
import com.obracerta.model.dto.project.ProjectCreateDTO;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.User;
import com.obracerta.repository.ProjectRepository;
import com.obracerta.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Spy
    private ProjectMapper projectMapper = new ProjectMapper();

    @InjectMocks
    private ProjectService projectService;

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createsProjectLinkedToAuthenticatedUserAndPersistsIt() {
        User authenticatedUser = user("user-1");
        authenticate(authenticatedUser);
        ProjectCreateDTO request = new ProjectCreateDTO("Minha obra", ProjectType.NEW_CONSTRUCTION, "Guarapuava");

        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> {
            Project project = invocation.getArgument(0);
            project.setId("project-1");
            return project;
        });

        var response = projectService.create(request);

        assertThat(response.id()).isEqualTo("project-1");
        assertThat(response.name()).isEqualTo("Minha obra");
        assertThat(response.type()).isEqualTo(ProjectType.NEW_CONSTRUCTION);
        verify(projectRepository).save(argThat(project ->
                project.getUser() == authenticatedUser
                        && project.getStatus() != null
                        && project.getName().equals("Minha obra")));
    }

    @Test
    void throwsNotFoundWhenRepositoryReturnsEmptyForAuthenticatedUser() {
        User authenticatedUser = user("user-1");
        authenticate(authenticatedUser);

        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("project-2", "user-1"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.findById("project-2"))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(projectRepository).findByIdAndUserIdAndDeletedAtIsNull("project-2", "user-1");
    }

    private static User user(String id) {
        User user = new User();
        user.setId(id);
        user.setEmail(id + "@example.com");
        return user;
    }

    private static void authenticate(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
    }
}
