package com.example.InvoiceManage.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "`order`")
public class Order {
    @Id
    @Column(name = "id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

//    @Column(name = "picture")
//    private String picture;

//    @Column(name = "token_order", nullable = false)
//    private String tokenOrder;

    @Column(name = "total", nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

//    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "status", nullable = false)
    private Status status;

    @Column(name = "date")
    private Instant date;

//    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @OneToMany(
            mappedBy = "order", // "order" là tên thuộc tính trong class OrderDetail
            cascade = CascadeType.ALL, // Khi lưu/xóa Order thì các OrderDetail liên quan cũng được lưu/xóa
            orphanRemoval = true
    )
    private List<OrderDetail> orderDetails = new ArrayList<>();

}