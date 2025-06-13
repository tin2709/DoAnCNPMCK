package com.example.InvoiceManage.controller;

import com.example.InvoiceManage.DTO.request.OrderRequest;
import com.example.InvoiceManage.DTO.request.OrderUpdate;
import com.example.InvoiceManage.entity.Order;
import com.example.InvoiceManage.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.Serializable;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/dashboard")
@CrossOrigin(origins = "http://localhost:3000")
public class OrderController {
    @Autowired
    OrderService orderService;
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getStatistics(
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end) {

        Instant startDate = (start != null) ? Instant.parse(start + "T00:00:00Z") : null;
        Instant endDate = (end != null) ? Instant.parse(end + "T23:59:59Z") : null;

        List<Order> orders = (startDate != null && endDate != null)
                ? orderService.getOrdersByDateRange(startDate, endDate)
                : orderService.getAllOrders();

        List<Map<String, Object>> response = orders.stream().map(order -> {
            Map<String, Object> map = new HashMap<>();
            map.put("date", order.getDate().toString());
            map.put("value", order.getTotal());
            return map;
        }).toList();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/add")
    public ResponseEntity<Void> addOrder(@RequestBody OrderRequest request) {
        orderService.addOrder(request);
        return ResponseEntity.ok().build();
    }
    @PutMapping("/update")
    public ResponseEntity<Void> updateOrder(@RequestBody OrderUpdate request) {
        orderService.updateOrder(request.getOrderId(), request.getStatusId());
        return ResponseEntity.ok().build();
    }
    @GetMapping("/list")
    public ResponseEntity<List<Order>> getOrders() {
        List<Order> list = orderService.getAllOrders();
        return ResponseEntity.ok(list);
    }


}
