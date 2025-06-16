// src/main/java/com/example/InvoiceManage/exception/AlreadyExistsException.java
package com.example.InvoiceManage.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT) // HTTP 409 Conflict is appropriate for resource already existing
public class AlreadyExistsException extends RuntimeException {
    public AlreadyExistsException(String message) {
        super(message);
    }
}