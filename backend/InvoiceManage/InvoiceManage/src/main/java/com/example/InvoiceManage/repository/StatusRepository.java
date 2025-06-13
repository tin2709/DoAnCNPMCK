package com.example.InvoiceManage.repository;

import com.example.InvoiceManage.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StatusRepository extends JpaRepository<Status,Integer> {
}
