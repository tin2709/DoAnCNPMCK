// File: com.example.InvoiceManage.DTO.response.UserResponse.java
package com.example.InvoiceManage.DTO.response;

import com.example.InvoiceManage.entity.Role; // Assuming Role entity is acceptable for direct inclusion

import lombok.AllArgsConstructor; // Add this if you want an all-args constructor
import lombok.Data;
import lombok.NoArgsConstructor; // Add this if you want a no-args constructor

@Data // Provides getters, setters, equals, hashCode, toString
@NoArgsConstructor // Lombok annotation for no-argument constructor
@AllArgsConstructor // Lombok annotation for constructor with all fields
public class UserResponse {
    private Long id;
    private String email;
    private String name;
    private Role role; // Only include the Role object here
    private String accessToken;
}