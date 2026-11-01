package com.obracerta.repository;

import com.obracerta.model.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, String> {

    @Query("""
            select e from Expense e
            left join e.pendingPayment pp
            where e.project.id = :projectId
              and e.project.user.id = :userId
              and e.project.deletedAt is null
              and e.deletedAt is null
              and (
                :tab = 'ALL'
                or (:tab = 'PENDING' and e.paid = false)
                or (:tab = 'OVERDUE' and e.paid = false
                    and pp is not null
                    and pp.deletedAt is null
                    and pp.dueDate < :referenceDate)
                or (:tab = 'PAID' and e.paid = true)
              )
            """)
    @EntityGraph(attributePaths = {"category", "supplier", "pendingPayment"})
    Page<Expense> findActiveByProjectOwnerAndTab(@Param("projectId") String projectId,
                                                  @Param("userId") String userId,
                                                  @Param("tab") String tab,
                                                  @Param("referenceDate") java.time.LocalDate referenceDate,
                                                  Pageable pageable);

    @Query("""
            select coalesce(sum(case when e.paid = true then e.totalPrice else 0 end), 0) as totalPaid,
                   coalesce(sum(case when e.paid = false then e.totalPrice else 0 end), 0) as totalPending
            from Expense e
            left join e.pendingPayment pp
            where e.project.id = :projectId
              and e.project.user.id = :userId
              and e.project.deletedAt is null
              and e.deletedAt is null
              and (
                :tab = 'ALL'
                or (:tab = 'PENDING' and e.paid = false)
                or (:tab = 'OVERDUE' and e.paid = false
                    and pp is not null
                    and pp.deletedAt is null
                    and pp.dueDate < :referenceDate)
                or (:tab = 'PAID' and e.paid = true)
              )
            """)
    ExpenseTotals sumActiveByProjectOwnerAndTab(@Param("projectId") String projectId,
                                                @Param("userId") String userId,
                                                @Param("tab") String tab,
                                                @Param("referenceDate") java.time.LocalDate referenceDate);

    interface ExpenseTotals {
        BigDecimal getTotalPaid();
        BigDecimal getTotalPending();
    }

    @Query("""
            select e from Expense e
            where e.project.id = :projectId
              and e.project.user.id = :userId
              and e.project.deletedAt is null
              and e.deletedAt is null
            """)
    @EntityGraph(attributePaths = {"category", "supplier", "pendingPayment"})
    Page<Expense> findActiveByProjectAndOwner(@Param("projectId") String projectId,
                                               @Param("userId") String userId,
                                               Pageable pageable);

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
