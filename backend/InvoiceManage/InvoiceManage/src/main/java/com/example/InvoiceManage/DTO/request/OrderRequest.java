package com.example.InvoiceManage.DTO.request;

import com.example.InvoiceManage.entity.Role;
import com.example.InvoiceManage.entity.Status;
import com.example.InvoiceManage.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class OrderRequest {
    private BigDecimal total;
    private int idStatus;
    private List<Integer> proList;
}
