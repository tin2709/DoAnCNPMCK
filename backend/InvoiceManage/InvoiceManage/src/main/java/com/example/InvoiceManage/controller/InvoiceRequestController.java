package com.example.InvoiceManage.controller;

import com.example.InvoiceManage.DTO.request.InvoiceRequestPendingDTO;
import com.example.InvoiceManage.DTO.response.InvoiceRequestResponse;
import com.example.InvoiceManage.entity.InvoiceRequest;
import com.example.InvoiceManage.entity.SecurityUser;
import com.example.InvoiceManage.service.InvoiceRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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
    public ResponseEntity<String> acceptInvoiceRequest(
            @AuthenticationPrincipal SecurityUser securityUser,
            @PathVariable("id") Long id) {
        invoiceRequestService.acceptInvoiceRequest(id);
        return ResponseEntity.ok("Yêu cầu đã được chấp nhận và hóa đơn đã được tạo");
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<String> rejectInvoiceRequest(
            @AuthenticationPrincipal SecurityUser securityUser,
            @PathVariable("id") Long id) { // ✅ đúng
        invoiceRequestService.rejectInvoiceRequest(id);
        return ResponseEntity.ok("Yêu cầu đã bị từ chối.");
    }
    @GetMapping
    public ResponseEntity<List<InvoiceRequestResponse>> getAll(
            @AuthenticationPrincipal SecurityUser securityUser) {

        List<InvoiceRequestResponse> responseDTOs = invoiceRequestService.getAll();
        return ResponseEntity.ok(responseDTOs);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<InvoiceRequestResponse> updateStatus( // 1. Trả về DTO, không phải Entity
                                                                @AuthenticationPrincipal SecurityUser securityUser,
                                                                @PathVariable("id") Long id,
                                                                @RequestBody Map<String, Integer> payload) {

        Integer newStatusId = payload.get("statusId");
        if (newStatusId == null) {
            return ResponseEntity.badRequest().build();
        }

        // 2. Service vẫn làm việc với Entity, điều này hoàn toàn đúng
        InvoiceRequest updatedEntity = invoiceRequestService.updateInvoiceRequestStatus(id, newStatusId);

        // 3. Chuyển đổi Entity sang DTO trước khi trả về cho client
        InvoiceRequestResponse responseDto = convertToDto(updatedEntity);

        // 4. Trả về DTO trong response, đảm bảo JSON luôn hợp lệ
        return ResponseEntity.ok(responseDto);
    }

    /**
     * Hàm trợ giúp chuyển đổi Entity sang DTO.
     * Hàm này nên nằm trong Controller hoặc một lớp Mapper riêng.
     */
    private InvoiceRequestResponse convertToDto(InvoiceRequest request) {
        return InvoiceRequestResponse.builder()
                .id(Long.valueOf(request.getId()))
                .orderId(request.getOrder().getId())
                .userName(request.getUser().getName())
                .statusId(request.getStatus().getId())
                .statusName(request.getStatus().getStatusName())
                // <<< SỬA ĐỔI QUAN TRỌNG >>>
                // Chuyển LocalDateTime thành chuỗi String theo chuẩn ISO 8601
                // JavaScript có thể đọc chuỗi này một cách hoàn hảo với `new Date()`
                .createdAt(LocalDateTime.parse(request.getCreatedAt().toString()))
                .build();
    }



}
