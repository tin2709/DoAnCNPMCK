package com.example.InvoiceManage.repository;

import com.example.InvoiceManage.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
}