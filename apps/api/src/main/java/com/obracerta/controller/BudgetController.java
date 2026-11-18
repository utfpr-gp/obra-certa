package com.obracerta.controller;

import com.obracerta.model.dto.budget.BudgetCategoryDTO;
import com.obracerta.model.dto.budget.BudgetOverviewDTO;
import com.obracerta.model.dto.budget.BudgetSetDTO;
import com.obracerta.model.dto.budget.SinapiAvailabilityDTO;
import com.obracerta.model.dto.budget.SinapiReferencesDTO;
import com.obracerta.service.BudgetService;
import com.obracerta.service.SinapiReferenceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;
    private final SinapiReferenceService sinapiReferences;

    public BudgetController(BudgetService budgetService, SinapiReferenceService sinapiReferences) {
        this.budgetService = budgetService;
        this.sinapiReferences = sinapiReferences;
    }

    @GetMapping("/{projectId}/sinapi/references")
    public ResponseEntity<SinapiReferencesDTO> getSinapiReferences(
            @PathVariable String projectId,
            @RequestParam(defaultValue = "") String uf,
            @RequestParam(defaultValue = "") String month,
            @RequestParam(defaultValue = "") String projectType) {
        return ResponseEntity.ok(sinapiReferences.getReferences(projectId, uf, month, projectType));
    }

    @GetMapping("/{projectId}/sinapi/availability")
    public ResponseEntity<SinapiAvailabilityDTO> getSinapiAvailability(
            @PathVariable String projectId,
            @RequestParam(defaultValue = "") String uf,
            @RequestParam(defaultValue = "") String year) {
        return ResponseEntity.ok(sinapiReferences.getAvailability(projectId, uf, year));
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

    @PostMapping("/{projectId}/sinapi/confirm")
    public ResponseEntity<com.obracerta.model.dto.budget.SinapiConfirmationDTO> confirmSinapi(
            @PathVariable String projectId,
            @Valid @RequestBody com.obracerta.model.dto.budget.SinapiConfirmDTO request) {
        return ResponseEntity.ok(budgetService.confirmSinapi(projectId, request));
    }

    @PostMapping("/{projectId}/categories/{categoryId}/zero")
    public ResponseEntity<BudgetCategoryDTO> zeroBudget(
            @PathVariable String projectId,
            @PathVariable String categoryId) {
        return ResponseEntity.ok(budgetService.zeroBudget(projectId, categoryId));
    }
}
