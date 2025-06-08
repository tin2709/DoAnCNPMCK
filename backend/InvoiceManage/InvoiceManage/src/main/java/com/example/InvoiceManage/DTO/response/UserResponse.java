package com.example.InvoiceManage.DTO.response;

import com.example.InvoiceManage.entity.Role;
import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

public class UserResponse {
    private Integer id;

    private String email;

    private String name;

    private Role role;

    private String password;

    private String phone;

    private Boolean active;

    private String picture;

    private Boolean role1 = false;
}
