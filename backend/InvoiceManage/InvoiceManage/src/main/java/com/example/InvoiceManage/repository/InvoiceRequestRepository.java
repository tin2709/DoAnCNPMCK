package com.example.InvoiceManage.repository;

import com.example.InvoiceManage.entity.InvoiceRequest;
import com.example.InvoiceManage.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvoiceRequestRepository extends JpaRepository<InvoiceRequest, Long> {
        List<InvoiceRequest> findByStatus(Status status);
        Optional<InvoiceRequest> findById(Long id);
    Optional<InvoiceRequest> findByOrderId(Long orderId);



    }
