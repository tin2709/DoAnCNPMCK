package com.example.InvoiceManage.mapper;

import com.example.InvoiceManage.DTO.response.*;
import com.example.InvoiceManage.entity.Order;
import com.example.InvoiceManage.entity.OrderDetail;
import com.example.InvoiceManage.entity.Product;
import com.example.InvoiceManage.entity.User;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class OrderMapper {

    // --- Phương thức chính ---
    public OrderResponseDTO toOrderResponseDTO(Order order) {
        if (order == null) {
            return null;
        }

        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setId(order.getId());
        dto.setTotal(order.getTotal());
        dto.setDate(order.getDate());

        // Ánh xạ các đối tượng lồng nhau
        if (order.getStatus() != null) {
            dto.setStatusName(order.getStatus().getStatusName());
        }
        dto.setCreatedBy(toUserInOrderDTO(order.getCreatedBy()));
        dto.setOrderDetails(order.getOrderDetails().stream()
                .map(this::toOrderDetailResponseDTO)
                .collect(Collectors.toList()));

        return dto;
    }

    private OrderDetailResponseDTO toOrderDetailResponseDTO(OrderDetail orderDetail) {
        if (orderDetail == null) {
            return null;
        }

        OrderDetailResponseDTO dto = new OrderDetailResponseDTO();
        dto.setId(orderDetail.getId());
        dto.setQuantity(orderDetail.getQuantity());
        dto.setPrice(orderDetail.getPrice());
        dto.setSubtotal(orderDetail.getSubtotal());
        dto.setProduct(toProductInDetailDTO(orderDetail.getProduct()));

        return dto;
    }

    private ProductInDetailDTO toProductInDetailDTO(Product product) {
        if (product == null) {
            return null;
        }

        return new ProductInDetailDTO(
                product.getProductName()
        );
    }

    private UserInOrderDTO toUserInOrderDTO(User user) {
        if (user == null) {
            return null;
        }

        UserInOrderDTO dto = new UserInOrderDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getName()); // Giả sử User entity có trường username

        return dto;
    }
    public OrderSummaryDTO toOrderSummaryDTO(Order order) {
        if (order == null) {
            return null;
        }

        return new OrderSummaryDTO(
                order.getId(),
                order.getTotal(),
                order.getDate(),
                order.getStatus().getId(),
                order.getStatus().getStatusName(),
                order.getCreatedBy().getName(),
                order.getOrderDetails().stream()
                        .map(this::toOrderDetailInfoDTO)
                        .collect(Collectors.toList())
        );
    }

    private OrderDetailInfoDTO toOrderDetailInfoDTO(OrderDetail detail) {
        if (detail == null) {
            return null;
        }

        return new OrderDetailInfoDTO(
                detail.getQuantity(),
                detail.getPrice(),
                new ProductInfoDTO(detail.getProduct().getProductName())
        );
    }
}