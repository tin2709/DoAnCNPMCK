package com.example.InvoiceManage.entity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity
@Table(name = "payment")
@Getter
@Setter
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY) // Dùng LAZY để tối ưu hiệu năng
    @JoinColumn(name = "order_id", nullable = false) // Đổi tên cột join thành order_id
    private Order order; // Đổi từ "private Invoice invoice;" thành "private Order order;

    @Column(name = "paid_at", nullable = false)
    private LocalDateTime paidAt = LocalDateTime.now();

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "payment_method", length = 100)
    private String paymentMethod; // Ví dụ: momo, cash, bank transfer

}
