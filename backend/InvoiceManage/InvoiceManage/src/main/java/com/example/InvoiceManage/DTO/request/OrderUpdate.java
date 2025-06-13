package com.example.InvoiceManage.DTO.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@RequiredArgsConstructor
@AllArgsConstructor
public class OrderUpdate {
    private int orderId;
    private int statusId;
}
