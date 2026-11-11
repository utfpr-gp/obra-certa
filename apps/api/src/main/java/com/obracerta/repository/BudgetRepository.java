package com.obracerta.repository;

import com.obracerta.model.entity.Budget;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
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

    /**
     * Insere um teto ativo somente se o par obra/categoria ainda não tiver um. O conflito é
     * tratado pelo próprio PostgreSQL: a transação não aborta, e o teto vencedor fica intacto.
     * Devolve 1 quando gravou e 0 quando já existia um teto ativo.
     */
    @Modifying
    @Query(value = """
            INSERT INTO budgets (id, user_id, project_id, category_id, estimated_amount, created_at, updated_at)
            VALUES (:id, :userId, :projectId, :categoryId, :amount, NOW(), NOW())
            ON CONFLICT (project_id, category_id) WHERE deleted_at IS NULL DO NOTHING
            """, nativeQuery = true)
    int insertIfAbsent(@Param("id") String id,
                       @Param("userId") String userId,
                       @Param("projectId") String projectId,
                       @Param("categoryId") String categoryId,
                       @Param("amount") BigDecimal amount);

    @Modifying
    @Query("update Budget b set b.deletedAt = :deletedAt where b.project.id = :projectId")
    int softDeleteByProjectId(@Param("projectId") String projectId, @Param("deletedAt") Instant deletedAt);
}
