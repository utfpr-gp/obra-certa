package com.obracerta.controller;

import com.obracerta.model.dto.expense.ExpenseResponseDTO;
import com.obracerta.service.ExpenseReceiptService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/expenses/{id}/receipt")
public class ExpenseReceiptController {
    private final ExpenseReceiptService service;
    public ExpenseReceiptController(ExpenseReceiptService service) { this.service=service; }
    @PutMapping(consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public ExpenseResponseDTO upload(@PathVariable String id,@RequestParam("file") MultipartFile file) {
        return service.upload(id,file);
    }
    @GetMapping
    public ResponseEntity<Resource> download(@PathVariable String id) {
        var receipt=service.download(id);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(receipt.contentType()))
                .contentLength(receipt.length()).cacheControl(CacheControl.noStore())
                .header("X-Content-Type-Options","nosniff")
                .header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.attachment().filename(receipt.filename()).build().toString())
                .body(new InputStreamResource(receipt.content()));
    }
}
