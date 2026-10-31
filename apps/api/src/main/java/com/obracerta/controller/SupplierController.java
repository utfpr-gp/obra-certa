package com.obracerta.controller;

import com.obracerta.model.dto.supplier.SupplierDTO;
import com.obracerta.service.SupplierService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/suppliers")
public class SupplierController {
    private final SupplierService service;
    public SupplierController(SupplierService service) { this.service=service; }
    @GetMapping public List<SupplierDTO> list() { return service.list(); }
}
