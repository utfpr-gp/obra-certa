package com.obracerta.repository;

import com.obracerta.model.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, String> {
    java.util.List<Supplier> findByUserIdOrderByNameAsc(String userId);
    Optional<Supplier> findByIdAndUserId(String id, String userId);
    Optional<Supplier> findFirstByUserIdAndDocument(String userId, String document);

    /**
     * O nome nao e unico no schema; findFirst evita
     * IncorrectResultSizeDataAccessException quando houver mais de um fornecedor homonimo.
     */
    Optional<Supplier> findFirstByName(String name);
}
