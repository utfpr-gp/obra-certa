package com.obracerta.model.dto.report;

/** Authorized snapshot for the local visual PDF composer. The appendix is base64 PDF. */
public record ReportExportDTO(ReportResponseDTO report, String filename, String appendixPdf) {}
