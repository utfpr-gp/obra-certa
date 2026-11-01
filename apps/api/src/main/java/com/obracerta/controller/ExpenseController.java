package com.obracerta.controller;

import com.obracerta.model.dto.expense.*;
import com.obracerta.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

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

    @GetMapping
    public com.obracerta.model.dto.expense.ExpensePageResponseDTO list(
            @RequestParam String projectId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "15") @Min(1) @Max(15) int size) {
        return service.list(projectId, page, size);
    }

    @DeleteMapping("/{id}")
    public ExpenseDeleteResponseDTO delete(@PathVariable String id) { return service.delete(id); }
}
