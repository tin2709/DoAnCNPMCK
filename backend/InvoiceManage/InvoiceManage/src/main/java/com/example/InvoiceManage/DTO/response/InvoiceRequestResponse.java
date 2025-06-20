package com.example.InvoiceManage.DTO.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InvoiceRequestResponse {
    private Long id;
    private Long orderId;
    private String username;
    private String createdAt;
    private String statusName;
}
