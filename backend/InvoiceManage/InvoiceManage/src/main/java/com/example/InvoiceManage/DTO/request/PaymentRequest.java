package com.example.InvoiceManage.DTO.request;

import lombok.*;

@Getter
@Setter
@Builder
@Data
@AllArgsConstructor@NoArgsConstructor
public class PaymentRequest {
    private int amount;
    private int invoiceRequestId;
    private String bankCode;
}
