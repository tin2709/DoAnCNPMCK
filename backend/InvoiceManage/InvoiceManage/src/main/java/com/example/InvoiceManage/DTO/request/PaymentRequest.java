package com.example.InvoiceManage.DTO.request;

import lombok.*;

@Getter
@Setter
@Builder
@Data
@AllArgsConstructor@NoArgsConstructor
public class PaymentRequest {
    private int amount;
    private Integer orderId; // ĐÃ THAY ĐỔI: từ invoiceRequestId thành orderId
    private String bankCode;
}
