// src/main/java/com/example/InvoiceManage/DTO/response/BestSellingProductDTO.java
package com.example.InvoiceManage.DTO.response;

import com.example.InvoiceManage.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
public class BestSellingProductDTO {
    private ProductInDetailDTO product;
    private Long totalQuantity;
    private BigDecimal totalRevenue;
    public BestSellingProductDTO(com.example.InvoiceManage.entity.Product productEntity, Long totalQuantity, BigDecimal totalRevenue) {
        this.product = new ProductInDetailDTO(
                productEntity.getProductName()
        );
        this.totalQuantity = totalQuantity;
        this.totalRevenue = totalRevenue;
    }
}