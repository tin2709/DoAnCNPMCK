package com.example.InvoiceManage.DTO.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@Data
public class ProductInDetailDTO {
    private Integer id;
    private String productName;
    private String image;
}