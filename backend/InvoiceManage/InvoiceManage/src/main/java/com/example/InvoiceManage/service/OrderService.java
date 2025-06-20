package com.example.InvoiceManage.service;

import com.example.InvoiceManage.DTO.request.OrderRequest;
import com.example.InvoiceManage.entity.*;
import com.example.InvoiceManage.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
@Service
public class OrderService {
    @Autowired
    OrderRepository orderRepository;
    @Autowired
    UserRepository userRepository;
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
    public void addOrder(OrderRequest request){
        Order newOne = new Order();
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        User a = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalAccessError("User không tồn tại"));
        Status b = statusRepository.findById(request.getIdStatus())
                .orElseThrow(() -> new IllegalAccessError("Trạng thái không tồn tại"));
        newOne.setDate(Instant.now());
//        newOne.setPicture(request.getPicture());
        newOne.setTotal(request.getTotal());
        newOne.setStatus(b);
        newOne.setCreatedBy(a);
        orderRepository.save(newOne);

//        newOne.setTokenOrder(request.getTokenOrder());
        for(Integer i : request.getProList()){
            Product newPro = productRepository.findById(i).orElseThrow(()-> new IllegalStateException("Sản phẩm này không tồn tại"));
            OrderDetail newOrderDetail = new OrderDetail(newOne,newPro,1,newPro.getPrice());
            orderDetailRepository.save(newOrderDetail);
        }


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
}
