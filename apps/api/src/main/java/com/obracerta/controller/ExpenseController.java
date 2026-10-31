package com.obracerta.controller;

import com.obracerta.model.dto.expense.*;
import com.obracerta.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;

@RestController @RequestMapping("/api/expenses")
public class ExpenseController {
    private final ExpenseService service;
    public ExpenseController(ExpenseService service) { this.service=service; }
    @PostMapping
    public ResponseEntity<ExpenseResponseDTO> create(@Valid @RequestBody ExpenseCreateDTO request) {
        var response=service.create(request);
        return ResponseEntity.created(URI.create("/api/expenses/"+response.id())).body(response);
    }
    @PutMapping("/{id}")
    public ExpenseResponseDTO update(@PathVariable String id, @Valid @RequestBody ExpenseUpdateDTO request) {
        return service.update(id, request);
    }
    @GetMapping("/{id}")
    public ExpenseResponseDTO get(@PathVariable String id) { return service.get(id); }
}
