package com.obracerta.controller;

import com.obracerta.model.dto.budget.BudgetOverviewDTO;
import com.obracerta.service.BudgetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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
}
