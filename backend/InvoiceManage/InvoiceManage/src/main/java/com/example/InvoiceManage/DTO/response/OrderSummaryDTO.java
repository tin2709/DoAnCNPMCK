package com.example.InvoiceManage.DTO.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderSummaryDTO {
    private int id;
    private BigDecimal total;
    private LocalDateTime date;
    private int statusId;
    private String statusName;
    private String customerName;
    private List<OrderDetailInfoDTO> orderDetails;
}