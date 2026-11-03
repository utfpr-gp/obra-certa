package com.obracerta.controller;

import com.obracerta.model.dto.report.ReportResponseDTO;
import com.obracerta.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects/{projectId}/reports")
public class ReportController {
    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    public ResponseEntity<ReportResponseDTO> getReport(@PathVariable String projectId) {
        return ResponseEntity.ok(reportService.getReport(projectId));
    }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable String projectId) {
        var pdf = reportService.exportPdf(projectId);
        return ResponseEntity.ok().contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        org.springframework.http.ContentDisposition.attachment().filename(pdf.filename()).build().toString())
                .body(pdf.content());
    }

    @GetMapping("/export")
    public ResponseEntity<com.obracerta.model.dto.report.ReportExportDTO> exportSnapshot(@PathVariable String projectId) {
        return ResponseEntity.ok().cacheControl(org.springframework.http.CacheControl.noStore())
                .body(reportService.exportSnapshot(projectId));
    }
}
