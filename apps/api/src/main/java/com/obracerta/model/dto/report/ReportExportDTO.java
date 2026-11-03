package com.obracerta.model.dto.report;

import java.time.LocalDate;

/** Authorized report snapshot consumed by the local visual PDF composer. */
public record ReportExportDTO(ReportResponseDTO report, String filename, String generatedAt,
                              LocalDate from, LocalDate to, String categoryName) {}
