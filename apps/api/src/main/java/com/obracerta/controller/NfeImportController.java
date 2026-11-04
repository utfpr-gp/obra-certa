package com.obracerta.controller;

import com.obracerta.model.dto.nfe.NfePreviewResponseDTO;
import com.obracerta.service.NfeImportService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/projects/{projectId}/nfe")
public class NfeImportController {
    private final NfeImportService service;
    public NfeImportController(NfeImportService service) { this.service = service; }

    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public NfePreviewResponseDTO preview(@PathVariable String projectId,
                                         @RequestParam("file") MultipartFile file) throws IOException {
        return service.preview(projectId, file.getBytes());
    }
}
