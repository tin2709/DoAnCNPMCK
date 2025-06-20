package com.example.InvoiceManage.DTO.response;

import lombok.Data;

@Data
public class UserInOrderDTO {
    private Integer id;
    private String username; // Hoặc fullName, email, tùy vào trường bạn có trong User entity
}