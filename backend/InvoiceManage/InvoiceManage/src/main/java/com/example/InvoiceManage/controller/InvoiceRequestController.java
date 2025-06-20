package com.example.InvoiceManage.controller;

import com.example.InvoiceManage.DTO.request.InvoiceRequestPendingDTO;
import com.example.InvoiceManage.DTO.response.InvoiceRequestResponse;
import com.example.InvoiceManage.entity.InvoiceRequest;
import com.example.InvoiceManage.service.InvoiceRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/invoice-requests")
@RequiredArgsConstructor
public class InvoiceRequestController {

    private final InvoiceRequestService invoiceRequestService;
    @GetMapping("/pending")
    public ResponseEntity<List<InvoiceRequestPendingDTO>> getPendingInvoiceRequests() {
        List<InvoiceRequestPendingDTO> pendingRequests = invoiceRequestService.getPendingInvoiceRequests();
        return ResponseEntity.ok(pendingRequests);
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<String> acceptInvoiceRequest(@PathVariable("id") Long id) {
        invoiceRequestService.acceptInvoiceRequest(id);
        return ResponseEntity.ok("Yêu cầu đã được chấp nhận và hóa đơn đã được tạo");
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<String> rejectInvoiceRequest(@PathVariable("id") Long id) { // ✅ đúng
        invoiceRequestService.rejectInvoiceRequest(id);
        return ResponseEntity.ok("Yêu cầu đã bị từ chối.");
    }

    @GetMapping
    public ResponseEntity<List<InvoiceRequest>> getAll() {
        return new ResponseEntity<>(invoiceRequestService.getAll(), HttpStatus.OK);
    }

}
