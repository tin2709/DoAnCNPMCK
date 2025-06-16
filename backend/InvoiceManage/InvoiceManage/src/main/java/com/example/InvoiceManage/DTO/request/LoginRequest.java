package com.example.InvoiceManage.DTO.request;

import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
}