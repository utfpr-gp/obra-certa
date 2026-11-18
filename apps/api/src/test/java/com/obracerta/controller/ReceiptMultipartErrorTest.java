package com.obracerta.controller;

import com.obracerta.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ReceiptMultipartErrorTest {
    @RestController
    static class MultipartFailureController {
        @PostMapping("/api/expenses/test/receipt")
        void upload() { throw new MaxUploadSizeExceededException(10485760); }
    }

    @Test void multipartLimitReturnsStructuredReceiptGuidance() throws Exception {
        MockMvcBuilders.standaloneSetup(new MultipartFailureController())
                .setControllerAdvice(new GlobalExceptionHandler()).build()
                .perform(post("/api/expenses/test/receipt"))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.status").value(413))
                .andExpect(jsonPath("$.path").value("/api/expenses/test/receipt"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("JPEG, PNG ou PDF")))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("10 MB")));
    }
}
