package com.example.InvoiceManage.controller;

import com.example.InvoiceManage.DTO.VnPayIpnData;
import com.example.InvoiceManage.DTO.request.PaymentRequest;
import com.example.InvoiceManage.entity.SecurityUser;
import com.example.InvoiceManage.service.VnPaySerivce;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;


@RestController
@RequestMapping("${api.prefix}/vnpay")
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class VnPayController {
    @Autowired
    private VnPaySerivce vnPaySerivce;

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(
            @RequestBody PaymentRequest paymentRequest,
            @AuthenticationPrincipal SecurityUser securityUser) {
        Map<String, String> data = vnPaySerivce.createOrder(paymentRequest, securityUser);
        return new ResponseEntity<>(data, HttpStatus.OK);
    }

    @GetMapping("/IPN")
    public ResponseEntity<Void> ipn(@RequestParam Map<String, String> params) {
        vnPaySerivce.ipn(params);
        return null;
    }
}
