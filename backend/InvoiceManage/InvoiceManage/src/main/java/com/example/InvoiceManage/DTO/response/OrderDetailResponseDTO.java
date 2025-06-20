package com.example.InvoiceManage.DTO.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderDetailResponseDTO {
    private Integer id; // ID của dòng order_detail
    private Integer quantity;
    private BigDecimal price; // Giá tại thời điểm mua
    private BigDecimal subtotal;
    private ProductInDetailDTO product; // Thông tin rút gọn của sản phẩm
}