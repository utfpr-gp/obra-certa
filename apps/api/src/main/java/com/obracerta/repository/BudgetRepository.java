package com.obracerta.repository;

import com.obracerta.model.entity.Budget;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, String> {

    @EntityGraph(attributePaths = "category")
    List<Budget> findByProjectIdAndDeletedAtIsNull(String projectId);

    @EntityGraph(attributePaths = "category")
    @Query("""
            select b from Budget b
            where b.project.id = :projectId
              and b.project.user.id = :userId
              and b.project.deletedAt is null
              and b.deletedAt is null
            """)
    List<Budget> findByProjectIdAndOwnerIdAndDeletedAtIsNull(@Param("projectId") String projectId,
                                                              @Param("userId") String userId);

    Optional<Budget> findByProjectIdAndCategoryIdAndDeletedAtIsNull(String projectId, String categoryId);

    @Modifying
    @Query("update Budget b set b.deletedAt = :deletedAt where b.project.id = :projectId")
    int softDeleteByProjectId(@Param("projectId") String projectId, @Param("deletedAt") Instant deletedAt);
}
