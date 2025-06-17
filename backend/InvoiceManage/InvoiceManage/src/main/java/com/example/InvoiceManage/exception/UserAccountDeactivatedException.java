package com.example.InvoiceManage.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN) // Khi exception này được ném ra, Spring sẽ tự động trả về HTTP 403
public class UserAccountDeactivatedException extends RuntimeException {
    public UserAccountDeactivatedException(String message) {
        super(message);
    }
}