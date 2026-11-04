package com.obracerta.service;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.exception.*;
import com.obracerta.integration.ReceiptStorage;
import com.obracerta.mapper.ExpenseMapper;
import com.obracerta.model.dto.expense.ExpenseResponseDTO;
import com.obracerta.model.entity.Expense;
import com.obracerta.repository.ExpenseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class ExpenseReceiptService {
    private static final long MAX_BYTES=10L*1024*1024;
    private static final Map<String,String> EXTENSIONS=Map.of("image/jpeg","jpg","image/png","png","application/pdf","pdf");
    private final ExpenseRepository expenses;
    private final UserContextHelper identity;
    private final ReceiptStorage storage;
    private final TransactionTemplate transactions;
    public ExpenseReceiptService(ExpenseRepository expenses,UserContextHelper identity,ReceiptStorage storage,
                                 PlatformTransactionManager transactionManager) {
        this.expenses=expenses; this.identity=identity; this.storage=storage;
        this.transactions=new TransactionTemplate(transactionManager);
        this.transactions.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }
    public ExpenseResponseDTO upload(String id,MultipartFile file) {
        String previousKey=transactions.execute(status -> {
            Expense expense=owned(id);
            validate(file);
            if ("UPLOADED".equals(expense.getReceiptState())) return expense.getReceiptKey();
            // Keep the original US03 retry intent even when the upload fails.
            expense.setReceiptState("PENDING");
            expenses.saveAndFlush(expense);
            return null;
        });
        String type=file.getContentType().toLowerCase(Locale.ROOT);
        String key="expenses/"+id+"/"+UUID.randomUUID()+"."+EXTENSIONS.get(type);
        try (InputStream input=file.getInputStream()) {
            storage.put(key,input,file.getSize(),type);
        } catch (IOException exception) {
            throw new ReceiptException(HttpStatus.SERVICE_UNAVAILABLE,"Não foi possível enviar o comprovante. Tente novamente.");
        }
        ExpenseResponseDTO result;
        try {
            result=transactions.execute(status -> {
                Expense expense=owned(id);
                expense.setReceiptKey(key); expense.setReceiptContentType(type); expense.setReceiptSize(file.getSize());
                expense.setReceiptState("UPLOADED");
                return ExpenseMapper.toDTO(expenses.saveAndFlush(expense));
            });
        } catch (RuntimeException exception) {
            // The association rolled back. Make just one immediate attempt to discard the unlinked upload.
            String message="A substituição do comprovante não foi confirmada. Consulte o estado atual antes de tentar novamente.";
            try { storage.delete(key); }
            catch (RuntimeException deletionFailure) { message+=" O arquivo novo não pôde ser apagado."; }
            throw new ReceiptException(HttpStatus.SERVICE_UNAVAILABLE,message);
        }
        // execute returns only after the new association has committed.
        if (previousKey!=null) {
            try { storage.delete(previousKey); }
            catch (RuntimeException exception) { return ExpenseMapper.withReceiptDeletionFailed(result,true); }
        }
        return result;
    }
    private static void validate(MultipartFile file) {
        String type=file.getContentType()==null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (file.isEmpty() || !EXTENSIONS.containsKey(type)) invalid();
        if (file.getSize()>MAX_BYTES) throw new ReceiptException(HttpStatus.PAYLOAD_TOO_LARGE,ReceiptException.FILE_GUIDANCE);
        String name=file.getOriginalFilename()==null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        boolean extension=name.endsWith("."+EXTENSIONS.get(type)) || (type.equals("image/jpeg") && name.endsWith(".jpeg"));
        if (!extension) invalid();
    }
    @Transactional(readOnly=true)
    public ReceiptDownload download(String id) {
        Expense expense=owned(id);
        if (!"UPLOADED".equals(expense.getReceiptState())) throw new ResourceNotFoundException("Comprovante não encontrado");
        return new ReceiptDownload(storage.get(expense.getReceiptKey()),expense.getReceiptContentType(),
                "comprovante-"+expense.getId()+"."+EXTENSIONS.get(expense.getReceiptContentType()),expense.getReceiptSize());
    }
    @Transactional
    public ExpenseResponseDTO remove(String id) {
        Expense expense=owned(id);
        if (!"UPLOADED".equals(expense.getReceiptState())) return ExpenseMapper.toDTO(expense);
        storage.delete(expense.getReceiptKey());
        expense.setReceiptKey(null); expense.setReceiptContentType(null); expense.setReceiptSize(null);
        expense.setReceiptState("NONE");
        try { return ExpenseMapper.toDTO(expenses.saveAndFlush(expense)); }
        catch (DataAccessException exception) {
            // The database rollback cannot restore the object. A manual retry can delete an absent object.
            throw new ReceiptException(HttpStatus.SERVICE_UNAVAILABLE,
                    "A remoção do comprovante não foi confirmada. Consulte o estado atual antes de tentar novamente.");
        }
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
