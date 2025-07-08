package com.example.InvoiceManage.repository;

import com.example.InvoiceManage.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByDateBetween(LocalDateTime startDate,LocalDateTime endDate);
    List<Order> findByCreatedById(Integer userId);
    @Query("SELECT new map(COALESCE(SUM(o.total), 0) as totalRevenue, COUNT(o) as totalOrders) " +
            "FROM Order o WHERE o.date BETWEEN :startDate AND :endDate")
    Optional<Map<String, Object>> getSummaryStatistics(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Query để đếm số lượng khách hàng mới (có đơn hàng đầu tiên trong khoảng thời gian)
    @Query("SELECT COUNT(DISTINCT o.createdBy) FROM Order o " +
            "WHERE o.createdBy.id NOT IN (SELECT o2.createdBy.id FROM Order o2 WHERE o2.date < :startDate) " +
            "AND o.date BETWEEN :startDate AND :endDate")
    long countNewCustomers(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    @Query("SELECT o FROM Order o " +
            "LEFT JOIN FETCH o.orderDetails od " +
            "LEFT JOIN FETCH od.product p " +
            "JOIN FETCH o.status s " +
            "JOIN FETCH o.createdBy u")
    List<Order> findAllWithDetails();
}
