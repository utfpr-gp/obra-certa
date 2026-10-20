package com.obracerta.repository;

import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = NONE)
class ProjectRepositoryTest {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void findsOnlyActiveProjectsOwnedByTheRequestedUser() {
        User userA = persistUser("a");
        User userB = persistUser("b");
        Project projectOfB = persistProject(userB, "Obra de B");

        assertThat(projectRepository.findByIdAndUserIdAndDeletedAtIsNull(projectOfB.getId(), userA.getId()))
                .isEmpty();
        assertThat(projectRepository.findByIdAndUserIdAndDeletedAtIsNull(projectOfB.getId(), userB.getId()))
                .contains(projectOfB);
    }

    @Test
    void doesNotFindAnOwnedProjectAfterSoftDelete() {
        User userA = persistUser("deleted");
        Project deletedProject = persistProject(userA, "Obra excluída");
        deletedProject.setDeletedAt(Instant.now());
        projectRepository.saveAndFlush(deletedProject);

        assertThat(projectRepository.findByIdAndUserIdAndDeletedAtIsNull(deletedProject.getId(), userA.getId()))
                .isEmpty();
    }

    @Test
    void doesNotFindAnUnknownProjectId() {
        User userA = persistUser("missing");

        assertThat(projectRepository.findByIdAndUserIdAndDeletedAtIsNull(
                UUID.randomUUID().toString(), userA.getId()))
                .isEmpty();
    }

    private User persistUser(String suffix) {
        return userRepository.saveAndFlush(User.builder()
                .name("Usuário " + suffix)
                .email("repository-" + suffix + "-" + UUID.randomUUID() + "@example.com")
                .password("password")
                .userRole(UserRole.USER)
                .build());
    }

    private Project persistProject(User user, String name) {
        return projectRepository.saveAndFlush(Project.builder()
                .user(user)
                .name(name)
                .type(ProjectType.NEW_CONSTRUCTION)
                .status(ProjectStatus.IN_PROGRESS)
                .location("Local privado")
                .build());
    }
}
