package com.example.InvoiceManage.controller;

import com.example.InvoiceManage.DTO.request.OrderRequest;
import com.example.InvoiceManage.DTO.request.OrderUpdate;
import com.example.InvoiceManage.DTO.response.OrderResponseDTO;
import com.example.InvoiceManage.DTO.response.OrderSummaryDTO;
import com.example.InvoiceManage.config.constants.SecurityConstants;
import com.example.InvoiceManage.entity.Order;
import com.example.InvoiceManage.entity.SecurityUser;
import com.example.InvoiceManage.mapper.OrderMapper;
import com.example.InvoiceManage.repository.InvoiceRequestRepository;
import com.example.InvoiceManage.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping(SecurityConstants.API_PREFIX + "/orders")
@CrossOrigin(origins = "http://localhost:3000")
public class OrderController {
    @Autowired
    private OrderService orderService;
    @Autowired
    private OrderMapper orderMapper;
    @Autowired
    private InvoiceRequestRepository invoiceRequestRepository; // Có vẻ không được sử dụng, có thể xem xét xóa

    /**
     * Hàm helper để chuyển đổi chuỗi ngày (yyyy-MM-dd) thành LocalDateTime.
     * @param dateStr Chuỗi ngày từ request.
     * @param isEnd   True nếu là ngày kết thúc (lấy cuối ngày), false nếu là ngày bắt đầu (lấy đầu ngày).
     * @return Một đối tượng LocalDateTime.
     */
    private LocalDateTime parseDateTime(String dateStr, boolean isEnd) {
        if (dateStr == null || dateStr.isBlank()) {
            // Nếu không có ngày, trả về một khoảng mặc định (ví dụ: 1 năm trước đến hiện tại)
            return isEnd ? LocalDateTime.now() : LocalDate.now().minusYears(1).atStartOfDay();
        }
        LocalDate date = LocalDate.parse(dateStr);
        return isEnd ? date.atTime(LocalTime.MAX) : date.atStartOfDay();
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getStatistics(
            @AuthenticationPrincipal SecurityUser securityUser,
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end) {

        // Sử dụng hàm helper mới để chuyển đổi an toàn
        LocalDateTime startDate = parseDateTime(start, false);
        LocalDateTime endDate = parseDateTime(end, true);

        List<Order> orders = orderService.getOrdersByDateRange(startDate, endDate);

        List<Map<String, Object>> response = orders.stream().map(order -> {
            Map<String, Object> map = new HashMap<>();
            map.put("date", order.getDate().toString());
            map.put("value", order.getTotal());
            return map;
        }).toList();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/add")
    public ResponseEntity<OrderResponseDTO> addOrder(
            @AuthenticationPrincipal SecurityUser securityUser,
            @RequestBody OrderRequest request) {
        Order createdOrder = orderService.addOrder(request);
        OrderResponseDTO responseDTO = orderMapper.toOrderResponseDTO(createdOrder);
        return new ResponseEntity<>(responseDTO, HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<Void> updateOrder(
            @AuthenticationPrincipal SecurityUser securityUser,
            @RequestBody OrderUpdate request) {
        orderService.updateOrder(request.getOrderId(), request.getStatusId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{orderId}")
    public ResponseEntity<Void> undoOrder(
            @AuthenticationPrincipal SecurityUser securityUser,
            @PathVariable Integer orderId) {
        orderService.undoOrderCreation(orderId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/list")
    public ResponseEntity<List<OrderSummaryDTO>> getOrders(
            @AuthenticationPrincipal SecurityUser securityUser) {
        List<OrderSummaryDTO> list = orderService.getAllOrder();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getOrdersForUser(
            @PathVariable Integer userId,
            @AuthenticationPrincipal SecurityUser securityUser) {
        List<Order> userOrders = orderService.getOrdersByUserId(userId);
        List<OrderResponseDTO> responseDTOs = userOrders.stream()
                .map(orderMapper::toOrderResponseDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responseDTOs);
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummaryStatistics(
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end) {
        LocalDateTime startDate = parseDateTime(start, false);
        LocalDateTime endDate = parseDateTime(end, true);
        Map<String, Object> summary = orderService.getDashboardSummary(startDate, endDate);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/top-products")
    public ResponseEntity<?> getTopProducts(
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end,
            @RequestParam(defaultValue = "quantity") String sortBy,
            @RequestParam(defaultValue = "10") int limit) {
        LocalDateTime startDate = parseDateTime(start, false);
        LocalDateTime endDate = parseDateTime(end, true);
        return ResponseEntity.ok(orderService.getTopSellingProducts(startDate, endDate, sortBy, limit));
    }

    @GetMapping("/frequently-bought-together")
    public ResponseEntity<?> getFrequentlyBoughtTogether(
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end,
            @RequestParam(defaultValue = "10") int limit) {
        LocalDateTime startDate = parseDateTime(start, false);
        LocalDateTime endDate = parseDateTime(end, true);
        return ResponseEntity.ok(orderService.getFrequentlyBoughtTogether(startDate, endDate, limit));
    }
}