package com.example.InvoiceManage.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "order_detail")
@AllArgsConstructor
@RequiredArgsConstructor
public class OrderDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Liên kết Many-to-One tới Order
    // Một OrderDetail chỉ thuộc về một Order
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // Liên kết Many-to-One tới Product
    // Một OrderDetail chỉ tương ứng với một Product
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // Số lượng sản phẩm được mua trong đơn hàng này
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    // Giá của sản phẩm tại thời điểm đặt hàng
    // Rất quan trọng: Phải lưu lại giá tại thời điểm mua,
    // vì giá trong bảng Product có thể thay đổi trong tương lai.
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    // (Tùy chọn) Có thể thêm cột tổng phụ cho dòng này
    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    // Hàm tiện ích để tính tổng phụ
    @PrePersist
    @PreUpdate
    public void calculateSubtotal() {
        if (price != null && quantity != null) {
            this.subtotal = price.multiply(BigDecimal.valueOf(quantity));
        }
    }
    public OrderDetail(Order order, Product product, Integer quantity, BigDecimal price) {
        this.order = order;
        this.product = product;
        this.quantity = quantity;
        this.price = price;
        calculateSubtotal(); // Gọi hàm tính subtotal ngay khi khởi tạo
    }

}