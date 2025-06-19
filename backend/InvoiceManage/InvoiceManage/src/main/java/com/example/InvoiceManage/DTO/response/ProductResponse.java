package com.example.InvoiceManage.DTO.response;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
@Getter
@Setter
public class ProductResponse {
    private Integer id;
    private String productName;
    private String categoryName; // Chỉ lấy tên category thay vì cả object
    private String image;
    private BigDecimal price;
    private String des;
    private Integer quantity;
}
