package com.example.InvoiceManage.DTO.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetailInfoDTO {
    private int quantity;
    private BigDecimal price;
    private ProductInfoDTO product;
}