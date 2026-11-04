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
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, String> {

    @Query("""
            select e from Expense e join fetch e.pendingPayment pp
            where e.project.id = :projectId and e.project.user.id = :userId
              and e.project.deletedAt is null and e.deletedAt is null
              and e.paid = false and pp.status = com.obracerta.enums.PaymentStatus.PENDING
              and pp.deletedAt is null and pp.dueDate <= :horizon
            order by pp.dueDate asc, e.id asc
            """)
    List<Expense> findPaymentAlerts(@Param("projectId") String projectId,
                                    @Param("userId") String userId,
                                    @Param("horizon") LocalDate horizon);

    String FILTERED_EXPENSES = """
            from Expense e left join e.pendingPayment pp
            where e.project.id = :#{#query.projectId()}
              and e.project.user.id = :userId
              and e.project.deletedAt is null and e.deletedAt is null
              and (:#{#query.tab().name()} = 'ALL'
                or (:#{#query.tab().name()} = 'PENDING' and e.paid = false)
                or (:#{#query.tab().name()} = 'OVERDUE' and e.paid = false
                    and pp.deletedAt is null and pp.dueDate < :referenceDate)
                or (:#{#query.tab().name()} = 'PAID' and e.paid = true))
              and (:#{#query.purchaseDateFrom() == null} = true
                   or e.purchaseDate >= :#{#query.purchaseDateFrom()})
              and (:#{#query.purchaseDateTo() == null} = true
                   or e.purchaseDate <= :#{#query.purchaseDateTo()})
              and (:#{#query.dueDateFrom() == null} = true
                   or (pp.deletedAt is null and pp.dueDate >= :#{#query.dueDateFrom()}))
              and (:#{#query.dueDateTo() == null} = true
                   or (pp.deletedAt is null and pp.dueDate <= :#{#query.dueDateTo()}))
              and (:#{#query.categoryIds().isEmpty()} = true or e.category.id in :#{#query.categoryIds()})
              and (:#{#query.supplierId()} is null or e.supplier.id = :#{#query.supplierId()})
            """;

    @Query("select e " + FILTERED_EXPENSES)
    @EntityGraph(attributePaths = {"category", "supplier", "pendingPayment"})
    Page<Expense> findActiveByFilters(@Param("query") com.obracerta.model.dto.expense.ExpenseListQueryDTO query,
                                     @Param("userId") String userId,
                                     @Param("referenceDate") java.time.LocalDate referenceDate, Pageable pageable);

    @Query("""
            select coalesce(sum(case when e.paid = true then e.totalPrice else 0 end), 0) as totalPaid,
                   coalesce(sum(case when e.paid = false then e.totalPrice else 0 end), 0) as totalPending
            """ + FILTERED_EXPENSES)
    ExpenseTotals sumActiveByFilters(@Param("query") com.obracerta.model.dto.expense.ExpenseListQueryDTO query,
                                    @Param("userId") String userId,
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

    @Query("""
            select e.category.id as categoryId,
                   e.category.name as categoryName,
                   sum(e.totalPrice) as total
            from Expense e
            where e.project.id = :projectId
              and e.project.user.id = :userId
              and e.project.deletedAt is null
              and e.deletedAt is null
              and (cast(:from as date) is null or e.purchaseDate >= :from)
              and (cast(:to as date) is null or e.purchaseDate <= :to)
              and (cast(:category as string) is null or e.category.id = :category)
            group by e.category.id, e.category.name
            """)
    List<CategoryExpenseTotal> sumActiveByCategoryAndOwner(@Param("projectId") String projectId,
                                                            @Param("userId") String userId,
                                                          @Param("from") LocalDate from,
                                                          @Param("to") LocalDate to,
                                                          @Param("category") String category);

    @Query("""
            select coalesce(sum(case when e.paid = true then e.totalPrice else 0 end), 0) as totalPaid,
                   coalesce(sum(case when e.paid = false then e.totalPrice else 0 end), 0) as totalPending
            from Expense e
            where e.project.id = :projectId
              and e.project.user.id = :userId
              and e.project.deletedAt is null
              and e.deletedAt is null
              and (cast(:from as date) is null or e.purchaseDate >= :from)
              and (cast(:to as date) is null or e.purchaseDate <= :to)
              and (cast(:category as string) is null or e.category.id = :category)
            """)
    ReportExpenseTotals sumActiveTotalsByProjectAndOwner(@Param("projectId") String projectId,
                                                          @Param("userId") String userId,
                                                          @Param("from") LocalDate from,
                                                          @Param("to") LocalDate to,
                                                          @Param("category") String category);

    @Modifying
    @Query("update Expense e set e.deletedAt = :deletedAt where e.project.id = :projectId")
    int softDeleteByProjectId(@Param("projectId") String projectId, @Param("deletedAt") Instant deletedAt);

    interface CategoryExpenseTotal {
        String getCategoryId();

        String getCategoryName();

        BigDecimal getTotal();
    }

    interface ReportExpenseTotals {
        BigDecimal getTotalPaid();
        BigDecimal getTotalPending();
    }
}
