package com.obracerta.repository;

import com.obracerta.model.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, String> {

    List<Project> findByUserIdAndDeletedAtIsNull(String userId);

    Optional<Project> findByIdAndUserIdAndDeletedAtIsNull(String id, String userId);
}
