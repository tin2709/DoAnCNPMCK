package com.example.InvoiceManage.service;

import com.example.InvoiceManage.DTO.request.InvoiceRequestPendingDTO;
import com.example.InvoiceManage.DTO.response.InvoiceRequestResponse;
import com.example.InvoiceManage.entity.Invoice;
import com.example.InvoiceManage.entity.InvoiceRequest;
import com.example.InvoiceManage.entity.Order;
import com.example.InvoiceManage.entity.Status;
import com.example.InvoiceManage.repository.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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
//                        .tokenOrder(req.getOrder().getTokenOrder())
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

    public List<InvoiceRequestResponse> getAll() {
        // Lấy danh sách entity từ database
        List<InvoiceRequest> requests = invoiceRequestRepository.findAll();

        // Sử dụng Stream API để chuyển đổi mỗi entity thành DTO
        return requests.stream()
                .map(this::convertToDto) // Gọi hàm trợ giúp để chuyển đổi
                .collect(Collectors.toList());
    }

    /**
     * Hàm trợ giúp để chuyển đổi một InvoiceRequest (Entity) sang InvoiceRequestResponseDTO.
     * @param request Entity nguồn
     * @return DTO kết quả
     */
    private InvoiceRequestResponse convertToDto(InvoiceRequest request) {
        return InvoiceRequestResponse.builder()
                .id(Long.valueOf(request.getId()))
                .orderId(request.getOrder().getId())
                .userName(request.getUser().getName())
                .statusId(request.getStatus().getId())
                .statusName(request.getStatus().getStatusName())
                .createdAt(LocalDateTime.parse(request.getCreatedAt().toString())) // Chuyển sang String để JSON xử lý dễ dàng
                .build();
    }
    @Transactional // Annotation này rất quan trọng để đảm bảo tính toàn vẹn dữ liệu
    public InvoiceRequest updateInvoiceRequestStatus(Long requestId, Integer newStatusId) {
        // 1. Kiểm tra ID trạng thái mới có hợp lệ không
        if (newStatusId < 1 || newStatusId > 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái mới không hợp lệ. Chỉ chấp nhận 1, 2, hoặc 3.");
        }

        // 2. Tìm yêu cầu hóa đơn hoặc báo lỗi
        InvoiceRequest request = invoiceRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu hóa đơn với ID: " + requestId));

        // 3. Không cho phép thay đổi nếu đã ở trạng thái "Đã thanh toán"
        if (request.getStatus().getId() == 4) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không thể thay đổi trạng thái của yêu cầu đã được thanh toán.");
        }

        // 4. Tìm trạng thái mới hoặc báo lỗi
        Status newStatus = statusRepository.findById(newStatusId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy trạng thái với ID: " + newStatusId));

        // --- LOGIC MỚI BẮT ĐẦU TẠI ĐÂY ---

        // 5. Lấy đơn hàng (Order) liên quan từ yêu cầu
        Order orderToUpdate = request.getOrder();
        if (orderToUpdate == null) {
            // Trường hợp này không nên xảy ra nếu ràng buộc DB là not-null
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Yêu cầu hóa đơn không liên kết với đơn hàng nào.");
        }

        // 6. Cập nhật trạng thái cho đơn hàng đó
        orderToUpdate.setStatus(newStatus);
        orderRepository.save(orderToUpdate); // Lưu lại thay đổi trên Order

        // --- LOGIC CŨ VẪN GIỮ NGUYÊN ---

        // 7. Cập nhật trạng thái cho chính yêu cầu hóa đơn
        request.setStatus(newStatus);

        // 8. Lưu và trả về yêu cầu đã được cập nhật
        return invoiceRequestRepository.save(request);
    }
    @Transactional
    public InvoiceRequest updateStatusByOrderId(Long orderId, Integer newStatusId) {
        // Bước 1: Tìm InvoiceRequest thông qua orderId.
        // Nếu không tìm thấy, ném ra lỗi.
        InvoiceRequest invoiceRequest = invoiceRequestRepository.findByOrderId(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy InvoiceRequest nào cho Order ID: " + orderId));

        // Bước 2: Tìm trạng thái (Status) mới từ newStatusId.
        // Nếu không tìm thấy, ném ra lỗi.
        Status newStatus = statusRepository.findById(newStatusId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Status với ID: " + newStatusId));

        // (Tùy chọn - Logic bảo mật) Bạn có thể kiểm tra xem người dùng hiện tại có quyền cập nhật không
        // ví dụ: SecurityContextHolder.getContext().getAuthentication()...

        // Bước 3: Cập nhật trạng thái cho InvoiceRequest đã tìm thấy.
        invoiceRequest.setStatus(newStatus);

        // Bước 4: Lưu lại vào CSDL và trả về entity đã được cập nhật.
        return invoiceRequestRepository.save(invoiceRequest);
    }
}
