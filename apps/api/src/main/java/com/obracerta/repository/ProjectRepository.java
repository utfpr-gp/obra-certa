package com.obracerta.repository;

import com.obracerta.model.entity.Project;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, String> {

    List<Project> findByUserIdAndDeletedAtIsNull(String userId);

    Optional<Project> findByIdAndUserIdAndDeletedAtIsNull(String id, String userId);

    // SELECT ... FOR UPDATE na obra: serializa as gravações de NF-e da mesma obra.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Project p where p.id = :projectId and p.deletedAt is null")
    Optional<Project> lockActiveById(@Param("projectId") String projectId);

    @Query("""
            select count(e) from Expense e
            where e.project.id = :projectId and e.nfeKey = :nfeKey and e.deletedAt is null
            """)
    long countActiveExpensesByProjectIdAndNfeKey(@Param("projectId") String projectId,
                                                 @Param("nfeKey") String nfeKey);
}
