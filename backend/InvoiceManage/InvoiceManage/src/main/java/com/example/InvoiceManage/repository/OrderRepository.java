package com.example.InvoiceManage.repository;

import com.example.InvoiceManage.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByDateBetween(Instant startDate,Instant endDate);
}
