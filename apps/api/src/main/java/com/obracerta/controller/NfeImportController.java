package com.obracerta.controller;

import com.obracerta.model.dto.expense.ExpenseResponseDTO;
import com.obracerta.model.dto.nfe.NfeImportRequestDTO;
import com.obracerta.model.dto.nfe.NfePreviewResponseDTO;
import com.obracerta.service.NfeImportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

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

    @PostMapping(value = "/imports", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public List<ExpenseResponseDTO> confirm(@PathVariable String projectId,
                                            @RequestPart("file") MultipartFile file,
                                            @RequestPart("items") NfeImportRequestDTO request) throws IOException {
        return service.confirm(projectId, file.getBytes(), request);
    }
}
