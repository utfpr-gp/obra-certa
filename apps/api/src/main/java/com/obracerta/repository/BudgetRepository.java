package com.obracerta.repository;

import com.obracerta.model.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface BudgetRepository extends JpaRepository<Budget, String> {

    @Modifying
    @Query("update Budget b set b.deletedAt = :deletedAt where b.project.id = :projectId")
    int softDeleteByProjectId(@Param("projectId") String projectId, @Param("deletedAt") Instant deletedAt);
}
