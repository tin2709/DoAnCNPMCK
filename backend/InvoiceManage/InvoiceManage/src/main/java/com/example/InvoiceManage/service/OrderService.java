package com.example.InvoiceManage.service;

import com.example.InvoiceManage.entity.Order;
import com.example.InvoiceManage.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
@Service
public class OrderService {
    @Autowired
    OrderRepository orderRepository;
    public List<Order> getOrdersByDateRange(Instant startDate, Instant endDate) {
        return orderRepository.findByDateBetween(startDate, endDate);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
}
