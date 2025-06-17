package com.example.InvoiceManage.DTO.request;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InvoiceRequestPendingDTO {
    private Integer id;
    private String userName;
    private String tokenOrder;
    private LocalDateTime createdAt;
}