

// src/main/java/com/example/InvoiceManage/repository/OrderDetailRepository.java
package com.example.InvoiceManage.repository;

import com.example.InvoiceManage.DTO.response.BestSellingProductDTO;
import com.example.InvoiceManage.entity.OrderDetail;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, Integer> {

    // Query để lấy top sản phẩm bán chạy nhất dựa trên tổng số lượng
    @Query("SELECT new com.example.InvoiceManage.DTO.response.BestSellingProductDTO(od.product, SUM(od.quantity), SUM(od.subtotal)) " +
            "FROM OrderDetail od WHERE od.order.date BETWEEN :startDate AND :endDate " +
            "GROUP BY od.product " +
            "ORDER BY SUM(od.quantity) DESC")
    List<BestSellingProductDTO> findTopSellingProductsByQuantity(@Param("startDate") Instant startDate, @Param("endDate") Instant endDate, Pageable pageable);

    // Query để lấy top sản phẩm bán chạy nhất dựa trên tổng doanh thu
    @Query("SELECT new com.example.InvoiceManage.DTO.response.BestSellingProductDTO(od.product, SUM(od.quantity), SUM(od.subtotal)) " +
            "FROM OrderDetail od WHERE od.order.date BETWEEN :startDate AND :endDate " +
            "GROUP BY od.product " +
            "ORDER BY SUM(od.subtotal) DESC")
    List<BestSellingProductDTO> findTopSellingProductsByRevenue(@Param("startDate") Instant startDate, @Param("endDate") Instant endDate, Pageable pageable);

    // Query để tìm các cặp sản phẩm thường được mua cùng nhau
    @Query("SELECT od1.product.productName, od2.product.productName, COUNT(od1.order.id) as pairCount " +
            "FROM OrderDetail od1, OrderDetail od2 " +
            "WHERE od1.order.id = od2.order.id AND od1.product.id < od2.product.id " +
            "AND od1.order.date BETWEEN :startDate AND :endDate " +
            "GROUP BY od1.product.productName, od2.product.productName " +
            "ORDER BY pairCount DESC")
    List<Object[]> findFrequentlyBoughtTogether(
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            Pageable pageable
    );
}
