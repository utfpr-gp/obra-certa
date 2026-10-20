package com.obracerta.repository;

import com.obracerta.model.entity.PendingPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface PendingPaymentRepository extends JpaRepository<PendingPayment, String> {

    @Modifying
    @Query("""
            update PendingPayment p set p.deletedAt = :deletedAt
            where p.expense.project.id = :projectId
            """)
    int softDeleteByProjectId(@Param("projectId") String projectId, @Param("deletedAt") Instant deletedAt);
}
