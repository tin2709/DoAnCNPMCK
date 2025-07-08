package com.example.InvoiceManage.DTO.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InvoiceRequestResponse {
    private Long id;
    private Integer orderId;
    private String userName;
    private Integer statusId;
    private String statusName;
    private LocalDateTime createdAt;
}
