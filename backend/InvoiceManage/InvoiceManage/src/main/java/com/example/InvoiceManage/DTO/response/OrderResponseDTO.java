package com.example.InvoiceManage.DTO.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
public class OrderResponseDTO {
    private Integer id;
    private BigDecimal total;
    private String statusName; // Chỉ lấy tên status cho gọn
    private Instant date;
    private UserInOrderDTO createdBy; // Thông tin rút gọn của người tạo
    private List<OrderDetailResponseDTO> orderDetails; // Danh sách các sản phẩm trong đơn
}