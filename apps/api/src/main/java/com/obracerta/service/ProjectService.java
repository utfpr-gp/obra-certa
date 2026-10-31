package com.obracerta.service;

import com.obracerta.enums.ProjectStatus;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.mapper.ProjectMapper;
import com.obracerta.model.dto.project.ProjectCreateDTO;
import com.obracerta.model.dto.project.ProjectResponseDTO;
import com.obracerta.model.dto.project.ProjectUpdateDTO;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.User;
import com.obracerta.repository.ProjectRepository;
import com.obracerta.repository.BudgetRepository;
import com.obracerta.repository.ExpenseRepository;
import com.obracerta.repository.PendingPaymentRepository;
import com.obracerta.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMapper projectMapper;
    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final PendingPaymentRepository pendingPaymentRepository;
    private final Clock clock;

    public ProjectService(
            ProjectRepository projectRepository,
            UserRepository userRepository,
            ProjectMapper projectMapper,
            BudgetRepository budgetRepository,
            ExpenseRepository expenseRepository,
            PendingPaymentRepository pendingPaymentRepository,
            Clock clock) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.projectMapper = projectMapper;
        this.budgetRepository = budgetRepository;
        this.expenseRepository = expenseRepository;
        this.pendingPaymentRepository = pendingPaymentRepository;
        this.clock = clock;
    }

    public List<ProjectResponseDTO> findAll() {
        User user = authenticatedUser();
        return projectRepository.findByUserIdAndDeletedAtIsNull(user.getId()).stream()
                .map(projectMapper::toResponse)
                .toList();
    }

    public ProjectResponseDTO create(ProjectCreateDTO request) {
        User user = authenticatedUser();
        Project project = Project.builder()
                .user(user)
                .name(request.name())
                .type(request.type())
                .location(request.location())
                .status(ProjectStatus.IN_PROGRESS)
                .build();
        return projectMapper.toResponse(projectRepository.save(project));
    }

    public ProjectResponseDTO findById(String id) {
        User user = authenticatedUser();
        return projectRepository.findByIdAndUserIdAndDeletedAtIsNull(id, user.getId())
                .map(projectMapper::toResponse)
                .orElseThrow(ResourceNotFoundException::new);
    }

    @Transactional
    public ProjectResponseDTO update(String id, ProjectUpdateDTO request) {
        User user = authenticatedUser();
        Project project = projectRepository.findByIdAndUserIdAndDeletedAtIsNull(id, user.getId())
                .orElseThrow(ResourceNotFoundException::new);

        project.setName(request.name());
        project.setType(request.type());
        project.setLocation(request.location());
        project.setStatus(request.status());

        return projectMapper.toResponse(projectRepository.save(project));
    }

    @Transactional
    public void delete(String id) {
        User user = authenticatedUser();
        Project project = projectRepository.findByIdAndUserIdAndDeletedAtIsNull(id, user.getId())
                .orElseThrow(ResourceNotFoundException::new);

        Instant deletedAt = clock.instant();
        project.setDeletedAt(deletedAt);
        budgetRepository.softDeleteByProjectId(project.getId(), deletedAt);
        expenseRepository.softDeleteByProjectId(project.getId(), deletedAt);
        pendingPaymentRepository.softDeleteByProjectId(project.getId(), deletedAt);
        projectRepository.save(project);
    }

    private User authenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal() == null) {
            throw new ResourceNotFoundException();
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user;
        }
        if (principal instanceof UserDetails details) {
            return userRepository.findByEmail(details.getUsername())
                    .orElseThrow(ResourceNotFoundException::new);
        }
        throw new ResourceNotFoundException();
    }

}
