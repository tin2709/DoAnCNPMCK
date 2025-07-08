package com.example.InvoiceManage.service;

import com.example.InvoiceManage.DTO.request.OrderRequest;

import com.example.InvoiceManage.entity.*;
import com.example.InvoiceManage.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
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
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
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
    private InvoiceRequestRepository invoiceRequestRepository;
    @Autowired
    StatusRepository statusRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private OrderDetailRepository orderDetailRepository;

    public List<Order> getOrdersByDateRange(Instant startDate, Instant endDate) {
        return orderRepository.findByDateBetween(startDate, endDate);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
    @Transactional // Rất quan trọng để đảm bảo tính toàn vẹn dữ liệu
    public Order addOrder(OrderRequest request) {
        // 1. Lấy thông tin người dùng và trạng thái (không đổi)
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User không tồn tại"));

        Status orderStatus = statusRepository.findById(request.getIdStatus())
                .orElseThrow(() -> new IllegalStateException("Trạng thái đơn hàng không tồn tại"));

        // 2. Tạo đối tượng Order chính (không đổi)
        Order newOrder = new Order();
        newOrder.setCreatedBy(currentUser);
        newOrder.setStatus(orderStatus);
        newOrder.setDate(Instant.now());

        BigDecimal calculatedTotal = BigDecimal.ZERO;
        List<OrderDetail> detailsForOrder = new ArrayList<>();

        // 3. Lặp qua Map để tạo OrderDetail và cập nhật số lượng sản phẩm (không đổi)
        for (Map.Entry<Integer, Integer> item : request.getItems().entrySet()) {
            Integer productId = item.getKey();
            Integer requestedQuantity = item.getValue();

            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalStateException("Sản phẩm với ID " + productId + " không tồn tại"));

            int currentStock = product.getQuantity();

            if (currentStock < requestedQuantity) {
                throw new IllegalStateException(
                        String.format("Không đủ hàng cho sản phẩm '%s'. Yêu cầu: %d, Tồn kho: %d",
                                product.getProductName(), requestedQuantity, currentStock)
                );
            }

            product.setQuantity(currentStock - requestedQuantity);

            OrderDetail orderDetail = new OrderDetail(
                    newOrder,
                    product,
                    requestedQuantity,
                    product.getPrice()
            );

            detailsForOrder.add(orderDetail);
            calculatedTotal = calculatedTotal.add(orderDetail.getSubtotal());
        }

        // 4. Gán tổng giá trị và danh sách chi tiết cho Order (không đổi)
        newOrder.setTotal(calculatedTotal);
        newOrder.setOrderDetails(detailsForOrder);

        // 5. Lưu Order và các OrderDetail liên quan.
        // Hành động này sẽ trả về đối tượng Order đã được lưu và có ID.
        Order savedOrder = orderRepository.save(newOrder);

        // <<< LOGIC MỚI: TẠO INVOICE REQUEST TƯƠNG ỨNG >>>
        // 6. Lấy trạng thái "pending" (ID = 1) cho yêu cầu hóa đơn
        Status pendingInvoiceStatus = statusRepository.findById(1) // Giả định ID 1 là "Pending"
                .orElseThrow(() -> new IllegalStateException("Trạng thái 'Pending' cho yêu cầu hóa đơn (ID 1) không tồn tại."));

        // 7. Tạo đối tượng InvoiceRequest mới
        InvoiceRequest invoiceRequest = new InvoiceRequest();
        invoiceRequest.setUser(currentUser); // Người dùng đã tạo đơn hàng
        invoiceRequest.setOrder(savedOrder);   // Đơn hàng vừa được tạo
        invoiceRequest.setStatus(pendingInvoiceStatus); // Trạng thái luôn là "pending"

        // 8. Lưu InvoiceRequest vào cơ sở dữ liệu
        invoiceRequestRepository.save(invoiceRequest);
        // <<< KẾT THÚC LOGIC MỚI >>>

        // 9. Trả về đối tượng Order đã tạo để Controller xử lý response
        return savedOrder;
    }

    @Transactional
    public void undoOrderCreation(Integer orderId) {
        // 1. Tìm đơn hàng hoặc ném lỗi nếu không tồn tại
        Order orderToUndo = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalStateException("Đơn hàng với ID " + orderId + " không tồn tại để hoàn tác."));

        // 2. Lặp qua từng chi tiết đơn hàng để khôi phục số lượng sản phẩm
        for (OrderDetail detail : orderToUndo.getOrderDetails()) {
            Product product = detail.getProduct();
            int orderedQuantity = detail.getQuantity();

            // Cộng lại số lượng đã đặt vào kho
            product.setQuantity(product.getQuantity() + orderedQuantity);
            // Không cần gọi productRepository.save() vì đang trong giao dịch
        }

        // 3. Xóa đơn hàng. Do có `cascade` và `orphanRemoval`, các `OrderDetail` liên quan sẽ tự động bị xóa.
        orderRepository.delete(orderToUndo);
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
