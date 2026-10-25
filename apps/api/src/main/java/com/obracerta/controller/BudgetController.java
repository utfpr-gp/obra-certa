package com.obracerta.controller;

import com.obracerta.model.dto.budget.BudgetCategoryDTO;
import com.obracerta.model.dto.budget.BudgetOverviewDTO;
import com.obracerta.model.dto.budget.BudgetSetDTO;
import com.obracerta.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    public ResponseEntity<BudgetOverviewDTO> getOverview(@RequestParam String projectId) {
        return ResponseEntity.ok(budgetService.getOverview(projectId));
    }

    @PutMapping("/{projectId}/categories/{categoryId}")
    public ResponseEntity<BudgetCategoryDTO> setBudget(
            @PathVariable String projectId,
            @PathVariable String categoryId,
            @Valid @RequestBody BudgetSetDTO request) {
        return ResponseEntity.ok(budgetService.setBudget(projectId, categoryId, request));
    }
}
