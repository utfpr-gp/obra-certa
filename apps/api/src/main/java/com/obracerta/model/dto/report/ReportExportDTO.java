package com.obracerta.model.dto.report;

/** Authorized report snapshot consumed by the local visual PDF composer. */
public record ReportExportDTO(ReportResponseDTO report, String filename, String generatedAt) {}
