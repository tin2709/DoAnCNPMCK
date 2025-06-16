//package com.example.InvoiceManage.service;
//
//import com.example.InvoiceManage.DTO.request.OrderRequest;
//import com.example.InvoiceManage.entity.Order;
//import com.example.InvoiceManage.entity.Status;
//import com.example.InvoiceManage.entity.User;
//import com.example.InvoiceManage.repository.OrderRepository;
//import com.example.InvoiceManage.repository.StatusRepository;
//import com.example.InvoiceManage.repository.UserRepository;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//
//import java.time.Instant;
//import java.util.List;
//@Service
//public class OrderService {
//    @Autowired
//    OrderRepository orderRepository;
//    @Autowired
//    UserRepository userRepository;
//    @Autowired
//    StatusRepository statusRepository;
//    public List<Order> getOrdersByDateRange(Instant startDate, Instant endDate) {
//        return orderRepository.findByDateBetween(startDate, endDate);
//    }
//
//    public List<Order> getAllOrders() {
//        return orderRepository.findAll();
//    }
//    public void addOrder(OrderRequest request){
//        Order newOne = new Order();
//        User a = userRepository.findById(request.getUserId())
//                .orElseThrow(() -> new IllegalAccessError("User không tồn tại"));
//        Status b = statusRepository.findById(request.getIdStatus())
//                .orElseThrow(() -> new IllegalAccessError("Trạng thái không tồn tại"));
//        newOne.setTokenOrder(request.getTokenOrder());
//        newOne.setDate(Instant.now());
//        newOne.setPicture(request.getPicture());
//        newOne.setTotal(request.getTotal());
//        newOne.setStatus(b);
//        newOne.setCreatedBy(a);
//        orderRepository.save(newOne);
//    }
//    // thay đổi trang thái đơn hàng
//    public void updateOrder(int orderId,int statusId){
//        Order a = orderRepository.findById(orderId)
//                .orElseThrow(() -> new IllegalAccessError("Đơn hàng không tồn tại"));
//        Status b = statusRepository.findById(statusId)
//                .orElseThrow(() -> new IllegalAccessError("Trạng thái không tồn tại"));
//        a.setStatus(b);
//        orderRepository.save(a);
//    }
//}
