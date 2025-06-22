package com.example.InvoiceManage.service;

import com.example.InvoiceManage.DTO.request.OrderRequest;
import com.example.InvoiceManage.DTO.response.BestSellingProductDTO;
import com.example.InvoiceManage.entity.Order;
import com.example.InvoiceManage.entity.Status;
import com.example.InvoiceManage.entity.User;
import com.example.InvoiceManage.repository.OrderDetailRepository;
import com.example.InvoiceManage.repository.OrderRepository;
import com.example.InvoiceManage.repository.StatusRepository;
import com.example.InvoiceManage.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderService {
    @Autowired
    OrderRepository orderRepository;
    @Autowired
    UserRepository userRepository;
    @Autowired
    OrderDetailRepository orderDetailRepository;
    @Autowired
    StatusRepository statusRepository;
    public List<Order> getOrdersByDateRange(Instant startDate, Instant endDate) {
        return orderRepository.findByDateBetween(startDate, endDate);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
    public void addOrder(OrderRequest request){
        Order newOne = new Order();
        User a = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalAccessError("User không tồn tại"));
        Status b = statusRepository.findById(request.getIdStatus())
                .orElseThrow(() -> new IllegalAccessError("Trạng thái không tồn tại"));
//        newOne.setTokenOrder(request.getTokenOrder());
        newOne.setDate(Instant.now());
//        newOne.setPicture(request.getPicture());
        newOne.setTotal(request.getTotal());
        newOne.setStatus(b);
        newOne.setCreatedBy(a);
        orderRepository.save(newOne);
    }
    // thay đổi trang thái đơn hàng
    public void updateOrder(int orderId,int statusId){
        Order a = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalAccessError("Đơn hàng không tồn tại"));
        Status b = statusRepository.findById(statusId)
                .orElseThrow(() -> new IllegalAccessError("Trạng thái không tồn tại"));
        a.setStatus(b);
        orderRepository.save(a);
    }
    public List<Order> getOrdersByUserId(Integer userId) {
        return orderRepository.findByCreatedById(userId);
    }
    public Map<String, Object> getDashboardSummary(Instant startDate, Instant endDate) {
        // Lấy dữ liệu kỳ hiện tại
        Map<String, Object> currentPeriodStats = orderRepository.getSummaryStatistics(startDate, endDate)
                .orElse(Map.of("totalRevenue", BigDecimal.ZERO, "totalOrders", 0L));

        // Tính AOV cho kỳ hiện tại
        BigDecimal totalRevenue = (BigDecimal) currentPeriodStats.getOrDefault("totalRevenue", BigDecimal.ZERO);
        long totalOrders = (long) currentPeriodStats.getOrDefault("totalOrders", 0L);
        BigDecimal aov = (totalOrders > 0)
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        currentPeriodStats.put("averageOrderValue", aov);

        // Đếm khách hàng mới
        long newCustomers = orderRepository.countNewCustomers(startDate, endDate);
        currentPeriodStats.put("newCustomers", newCustomers);

        // Tính toán kỳ trước
        long daysBetween = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        Instant previousStartDate = startDate.minus(daysBetween, ChronoUnit.DAYS);
        Instant previousEndDate = startDate.minus(1, ChronoUnit.SECONDS);
        Map<String, Object> previousPeriodStats = orderRepository.getSummaryStatistics(previousStartDate, previousEndDate)
                .orElse(Map.of("totalRevenue", BigDecimal.ZERO, "totalOrders", 0L));

        // Đóng gói dữ liệu so sánh
        Map<String, Object> comparison = Map.of(
                "revenueComparison", calculateChangePercent((BigDecimal)previousPeriodStats.get("totalRevenue"), totalRevenue),
                "ordersComparison", calculateChangePercent(BigDecimal.valueOf((long)previousPeriodStats.get("totalOrders")), BigDecimal.valueOf(totalOrders))
        );
        currentPeriodStats.put("comparison", comparison);

        return currentPeriodStats;
    }

    /**
     * Lấy top sản phẩm bán chạy nhất.
     */
    public List<BestSellingProductDTO> getTopSellingProducts(Instant startDate, Instant endDate, String sortBy, int limit) {
        if ("revenue".equalsIgnoreCase(sortBy)) {
            return orderDetailRepository.findTopSellingProductsByRevenue(startDate, endDate, PageRequest.of(0, limit));
        }
        // Mặc định sắp xếp theo số lượng
        return orderDetailRepository.findTopSellingProductsByQuantity(startDate, endDate, PageRequest.of(0, limit));
    }

    /**
     * Lấy các cặp sản phẩm thường được mua cùng nhau.
     */
    public List<Map<String, Object>> getFrequentlyBoughtTogether(Instant startDate, Instant endDate, int limit) {
        List<Object[]> results = orderDetailRepository.findFrequentlyBoughtTogether(startDate, endDate, PageRequest.of(0, limit));
        return results.stream()
                .map(row -> Map.of(
                        "product1", row[0],
                        "product2", row[1],
                        "pairCount", row[2]
                ))
                .collect(Collectors.toList());
    }

    // Hàm tiện ích để tính phần trăm thay đổi
    private double calculateChangePercent(BigDecimal previous, BigDecimal current) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return (current != null && current.compareTo(BigDecimal.ZERO) > 0) ? 100.0 : 0.0;
        }
        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }
}
