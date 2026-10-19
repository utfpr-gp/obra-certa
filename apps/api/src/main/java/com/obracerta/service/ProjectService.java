package com.obracerta.service;

import com.obracerta.enums.ProjectStatus;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.mapper.ProjectMapper;
import com.obracerta.model.dto.project.ProjectCreateDTO;
import com.obracerta.model.dto.project.ProjectResponseDTO;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.User;
import com.obracerta.repository.ProjectRepository;
import com.obracerta.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMapper projectMapper;

    public ProjectService(
            ProjectRepository projectRepository,
            UserRepository userRepository,
            ProjectMapper projectMapper) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.projectMapper = projectMapper;
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
