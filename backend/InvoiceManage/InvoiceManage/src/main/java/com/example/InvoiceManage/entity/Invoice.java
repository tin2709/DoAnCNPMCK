package com.example.InvoiceManage.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoice")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "invoice_request_id", nullable = false)
    private InvoiceRequest invoiceRequest;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "status_id", nullable = false)
    private Status status; // ví dụ: processing, completed, paid

    @Column(nullable = false)
    private BigDecimal total;

    // getters, setters
}
