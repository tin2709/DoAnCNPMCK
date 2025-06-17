package com.example.InvoiceManage.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "invoice_request")
@Getter
@Setter
public class InvoiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // người yêu cầu

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order; // đơn hàng muốn hóa đơn

    @ManyToOne
    @JoinColumn(name = "status_id", nullable = false)
    private Status status; // pending / accepted / rejected

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

}
