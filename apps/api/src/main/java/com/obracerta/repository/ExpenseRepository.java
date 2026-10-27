package com.obracerta.repository;

import com.obracerta.model.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, String> {

    @Query("select e from Expense e where e.id = :id and e.project.user.id = :userId "
            + "and e.deletedAt is null and e.project.deletedAt is null")
    java.util.Optional<Expense> findActiveByIdAndOwner(@Param("id") String id, @Param("userId") String userId);

    @Query("""
            select e.category.id as categoryId,
                   e.category.name as categoryName,
                   sum(e.totalPrice) as total
            from Expense e
            where e.project.id = :projectId
              and e.deletedAt is null
            group by e.category.id, e.category.name
            """)
    List<CategoryExpenseTotal> sumActiveByCategory(@Param("projectId") String projectId);

    @Modifying
    @Query("update Expense e set e.deletedAt = :deletedAt where e.project.id = :projectId")
    int softDeleteByProjectId(@Param("projectId") String projectId, @Param("deletedAt") Instant deletedAt);

    interface CategoryExpenseTotal {
        String getCategoryId();

        String getCategoryName();

        BigDecimal getTotal();
    }
}
