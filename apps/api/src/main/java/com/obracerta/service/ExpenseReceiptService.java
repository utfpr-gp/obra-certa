package com.obracerta.service;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.exception.*;
import com.obracerta.integration.ReceiptStorage;
import com.obracerta.mapper.ExpenseMapper;
import com.obracerta.model.dto.expense.ExpenseResponseDTO;
import com.obracerta.model.entity.Expense;
import com.obracerta.repository.ExpenseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Map;

@Service
public class ExpenseReceiptService {
    private static final long MAX_BYTES=10L*1024*1024;
    private static final Map<String,String> EXTENSIONS=Map.of("image/jpeg","jpg","image/png","png","application/pdf","pdf");
    private final ExpenseRepository expenses;
    private final UserContextHelper identity;
    private final ReceiptStorage storage;
    public ExpenseReceiptService(ExpenseRepository expenses,UserContextHelper identity,ReceiptStorage storage) {
        this.expenses=expenses; this.identity=identity; this.storage=storage;
    }
    @Transactional(noRollbackFor=ReceiptException.class)
    public ExpenseResponseDTO upload(String id,MultipartFile file) {
        Expense expense=owned(id);
        if ("UPLOADED".equals(expense.getReceiptState()))
            throw new ReceiptException(HttpStatus.CONFLICT,"Este comprovante já foi enviado. Consulte a despesa.");
        String type=file.getContentType()==null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (file.isEmpty() || !EXTENSIONS.containsKey(type)) invalid();
        if (file.getSize()>MAX_BYTES) throw new ReceiptException(HttpStatus.PAYLOAD_TOO_LARGE,ReceiptException.FILE_GUIDANCE);
        String name=file.getOriginalFilename()==null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        boolean extension=name.endsWith("."+EXTENSIONS.get(type)) || (type.equals("image/jpeg") && name.endsWith(".jpeg"));
        if (!extension) invalid();
        // Keep the retry intent even when the private storage rejects this attempt.
        expense.setReceiptState("PENDING");
        // Deterministic private key lets a pending retry overwrite only its own unconfirmed object.
        String key="expenses/"+expense.getId()+"/receipt";
        try (InputStream input=file.getInputStream()) {
            storage.put(key,input,file.getSize(),type);
        } catch (IOException exception) {
            throw new ReceiptException(HttpStatus.SERVICE_UNAVAILABLE,"Não foi possível enviar o comprovante. Tente novamente.");
        }
        expense.setReceiptKey(key); expense.setReceiptContentType(type); expense.setReceiptSize(file.getSize());
        expense.setReceiptState("UPLOADED");
        return ExpenseMapper.toDTO(expenses.save(expense));
    }
    @Transactional(readOnly=true)
    public ReceiptDownload download(String id) {
        Expense expense=owned(id);
        if (!"UPLOADED".equals(expense.getReceiptState())) throw new ResourceNotFoundException("Comprovante não encontrado");
        return new ReceiptDownload(storage.get(expense.getReceiptKey()),expense.getReceiptContentType(),
                "comprovante-"+expense.getId()+"."+EXTENSIONS.get(expense.getReceiptContentType()),expense.getReceiptSize());
    }
    private Expense owned(String id) {
        return expenses.findActiveByIdAndOwner(id,identity.getAuthenticatedUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Despesa não encontrada"));
    }
    private static void invalid() {
        throw new ReceiptException(HttpStatus.BAD_REQUEST,ReceiptException.FILE_GUIDANCE);
    }
    public record ReceiptDownload(InputStream content,String contentType,String filename,long length) {}
}
