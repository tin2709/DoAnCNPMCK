package com.example.InvoiceManage.DTO.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "The Email Can't Blank")
    private String Email;

    @NotBlank(message = "The Password Can't Blank")
    private String password;
}
