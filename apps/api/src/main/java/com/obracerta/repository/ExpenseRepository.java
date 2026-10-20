package com.obracerta.repository;

import com.obracerta.model.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface ExpenseRepository extends JpaRepository<Expense, String> {

    @Modifying
    @Query("update Expense e set e.deletedAt = :deletedAt where e.project.id = :projectId")
    int softDeleteByProjectId(@Param("projectId") String projectId, @Param("deletedAt") Instant deletedAt);
}
