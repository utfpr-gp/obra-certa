package com.obracerta.service;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.mapper.ExpenseMapper;
import com.obracerta.model.dto.supplier.SupplierDTO;
import com.obracerta.repository.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class SupplierService {
    private final SupplierRepository suppliers;
    private final UserContextHelper identity;
    public SupplierService(SupplierRepository suppliers,UserContextHelper identity) {
        this.suppliers=suppliers; this.identity=identity;
    }
    @Transactional(readOnly=true)
    public List<SupplierDTO> list() {
        return suppliers.findByUserIdOrderByNameAsc(identity.getAuthenticatedUser().getId()).stream()
                .map(ExpenseMapper::toSupplierDTO).toList();
    }
}
