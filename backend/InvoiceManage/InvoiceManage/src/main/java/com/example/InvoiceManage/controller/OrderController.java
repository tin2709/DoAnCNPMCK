package com.example.InvoiceManage.controller;

import com.example.InvoiceManage.DTO.request.OrderRequest;
import com.example.InvoiceManage.DTO.request.OrderUpdate;
import com.example.InvoiceManage.DTO.response.OrderResponseDTO;
import com.example.InvoiceManage.config.constants.SecurityConstants;
import com.example.InvoiceManage.entity.Order;
import com.example.InvoiceManage.entity.SecurityUser;
import com.example.InvoiceManage.mapper.OrderMapper;
import com.example.InvoiceManage.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.Serializable;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
//@RequestMapping("/dashboard")
@RequestMapping(SecurityConstants.API_PREFIX + "/orders")
@CrossOrigin(origins = "http://localhost:3000")
public class OrderController {
    @Autowired
    OrderService orderService;
    @Autowired
    OrderMapper orderMapper;
    private Instant parseDate(String dateStr, boolean isEnd) {
        if (dateStr == null || dateStr.isBlank()) {
            return isEnd ? Instant.now() : LocalDate.now().minusYears(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        }
        LocalDate date = LocalDate.parse(dateStr);
        return isEnd ? date.atTime(23, 59, 59).toInstant(ZoneOffset.UTC) : date.atStartOfDay().toInstant(ZoneOffset.UTC);
    }
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getStatistics(
            @AuthenticationPrincipal SecurityUser securityUser,
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
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getOrdersForUser(
            @PathVariable Integer userId,
            @AuthenticationPrincipal SecurityUser securityUser) {

        List<Order> userOrders = orderService.getOrdersByUserId(userId);

        // Chuyển đổi sang DTO
        List<OrderResponseDTO> responseDTOs = userOrders.stream()
                .map(orderMapper::toOrderResponseDTO) // Dòng này sẽ gọi mapper mới của chúng ta
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseDTOs);
    }
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummaryStatistics(
            @AuthenticationPrincipal SecurityUser securityUser,
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end) {

        Instant startDate = parseDate(start, false);
        Instant endDate = parseDate(end, true);

        Map<String, Object> summary = orderService.getDashboardSummary(startDate, endDate);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/top-products")
    public ResponseEntity<?> getTopProducts(
            @AuthenticationPrincipal SecurityUser securityUser,
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end,
            @RequestParam(defaultValue = "quantity") String sortBy,
            @RequestParam(defaultValue = "10") int limit) {

        Instant startDate = parseDate(start, false);
        Instant endDate = parseDate(end, true);

        return ResponseEntity.ok(orderService.getTopSellingProducts(startDate, endDate, sortBy, limit));
    }

    @GetMapping("/frequently-bought-together")
    public ResponseEntity<?> getFrequentlyBoughtTogether(
            @AuthenticationPrincipal SecurityUser securityUser,
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end,
            @RequestParam(defaultValue = "10") int limit) {

        Instant startDate = parseDate(start, false);
        Instant endDate = parseDate(end, true);

        return ResponseEntity.ok(orderService.getFrequentlyBoughtTogether(startDate, endDate, limit));
    }


}
