package com.example.InvoiceManage.repository;

import com.example.InvoiceManage.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {
}