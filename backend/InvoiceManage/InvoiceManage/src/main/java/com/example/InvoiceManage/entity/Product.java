package com.example.InvoiceManage.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "product")
public class Product {
    @Id
    @Column(name = "id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_category", nullable = false)
    private Category idCategory;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "image")
    private String image;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Lob
    @Column(name = "des")
    private String des;

    @Column(name = "active")
    private Boolean active;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

}