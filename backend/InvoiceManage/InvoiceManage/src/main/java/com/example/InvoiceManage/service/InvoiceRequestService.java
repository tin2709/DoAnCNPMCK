package com.example.InvoiceManage.service;


import com.example.InvoiceManage.DTO.request.InvoiceRequestPendingDTO;
import com.example.InvoiceManage.entity.Invoice;
import com.example.InvoiceManage.entity.InvoiceRequest;
import com.example.InvoiceManage.entity.Status;
import com.example.InvoiceManage.repository.InvoiceRepository;
import com.example.InvoiceManage.repository.InvoiceRequestRepository;
import com.example.InvoiceManage.repository.StatusRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceRequestService {

    private final InvoiceRequestRepository invoiceRequestRepository;
    private final StatusRepository statusRepository;
    private final InvoiceRepository invoiceRepository;

    public List<InvoiceRequestPendingDTO> getPendingInvoiceRequests() {
        Status pendingStatus = statusRepository.findByStatusName("pending");
        return invoiceRequestRepository.findByStatus(pendingStatus)
                .stream()
                .map(req -> InvoiceRequestPendingDTO.builder()
                        .id(req.getId())
                        .userName(req.getUser().getName())
                        .tokenOrder(req.getOrder().getTokenOrder())
                        .createdAt(req.getCreatedAt())
                        .build()
                ).collect(Collectors.toList());
    }


    @Transactional
    public void acceptInvoiceRequest(Long requestId) {
        InvoiceRequest request = invoiceRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Yêu cầu hóa đơn không tồn tại"));

        Status approvedStatus = statusRepository.findByStatusName("approved");
        Status processingStatus = statusRepository.findByStatusName("processing"); // thêm status cho invoice

        if (approvedStatus == null || processingStatus == null) {
            throw new RuntimeException("Không tìm thấy status tương ứng");
        }

        // Cập nhật trạng thái yêu cầu
        request.setStatus(approvedStatus);
        invoiceRequestRepository.save(request);

        // Tạo hóa đơn mới
        Invoice invoice = Invoice.builder()
                .invoiceRequest(request)
                .issuedAt(LocalDateTime.now())
                .status(processingStatus)
                .total(request.getOrder().getTotal()) // lấy total từ Order nếu có
                .build();

        invoiceRepository.save(invoice);
    }

    @Transactional
    public void rejectInvoiceRequest(Long requestId) {
        InvoiceRequest request = invoiceRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Yêu cầu hóa đơn không tồn tại"));

        Status rejectedStatus = statusRepository.findByStatusName("rejected");

        if (rejectedStatus == null) {
            throw new RuntimeException("Không tìm thấy status 'rejected'");
        }

        // Cập nhật trạng thái yêu cầu hóa đơn
        request.setStatus(rejectedStatus);
        invoiceRequestRepository.save(request);
    }

}
