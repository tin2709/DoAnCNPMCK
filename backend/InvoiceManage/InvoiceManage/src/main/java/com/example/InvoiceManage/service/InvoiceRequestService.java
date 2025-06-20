package com.example.InvoiceManage.service;

import com.example.InvoiceManage.DTO.request.InvoiceRequestPendingDTO;
import com.example.InvoiceManage.entity.Invoice;
import com.example.InvoiceManage.entity.InvoiceRequest;
import com.example.InvoiceManage.entity.Status;
import com.example.InvoiceManage.repository.*;
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
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

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

        Status approvedStatus = statusRepository.findByStatusName("approved"); // Bạn có thể bỏ nếu không dùng nữa
        Status awaitingPaymentStatus = statusRepository.findByStatusName("paid");

        if (awaitingPaymentStatus == null) {
            throw new RuntimeException("Không tìm thấy status 'awaiting_payment'");
        }

        // Cập nhật trạng thái yêu cầu thành 'awaiting_payment' (hoặc bạn có thể tạo thêm trạng thái riêng cho request là 'approved')
        request.setStatus(awaitingPaymentStatus); // hoặc approvedStatus nếu vẫn dùng approved
        invoiceRequestRepository.save(request);

        // Tạo hóa đơn mới với trạng thái chờ thanh toán
        Invoice invoice = Invoice.builder()
                .invoiceRequest(request)
                .issuedAt(LocalDateTime.now())
                .status(awaitingPaymentStatus)
                .total(request.getOrder().getTotal())
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

        request.setStatus(rejectedStatus);
        invoiceRequestRepository.save(request);
    }

    public List<InvoiceRequest> getAll() {
        return invoiceRequestRepository.findAll();
    }
}
