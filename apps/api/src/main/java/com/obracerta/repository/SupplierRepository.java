package com.obracerta.repository;

import com.obracerta.model.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, String> {

    /**
     * O nome nao e unico no schema; findFirst evita
     * IncorrectResultSizeDataAccessException quando houver mais de um fornecedor homonimo.
     */
    Optional<Supplier> findFirstByName(String name);
}
