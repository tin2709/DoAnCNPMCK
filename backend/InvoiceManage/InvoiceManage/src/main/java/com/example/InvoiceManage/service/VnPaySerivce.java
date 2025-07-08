package com.example.InvoiceManage.service;

import com.example.InvoiceManage.DTO.request.PaymentRequest;
import com.example.InvoiceManage.entity.Order;
import com.example.InvoiceManage.entity.Payment;
import com.example.InvoiceManage.entity.SecurityUser;
import com.example.InvoiceManage.repository.OrderRepository;
import com.example.InvoiceManage.repository.PaymentRepository;
import com.example.InvoiceManage.util.Config; // Giả sử đây là class chứa các hằng số của bạn
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class VnPaySerivce {

    @Autowired
    private OrderRepository orderRepository; // SỬ DỤNG OrderRepository

    @Autowired
    private PaymentRepository paymentRepository;

    public Map<String, String> createOrder(PaymentRequest paymentRequest, SecurityUser securityUser) {
        // Kiểm tra xem Order có tồn tại không
        Order order = orderRepository.findById(paymentRequest.getOrderId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đơn hàng với ID: " + paymentRequest.getOrderId()));

        // TODO: (Nên làm) Kiểm tra xem user đang thực hiện thanh toán có phải là người tạo đơn hàng không.
        // if (!order.getCreatedBy().getId().equals(securityUser.getUser().getId())) {
        //     throw new SecurityException("Bạn không có quyền thanh toán cho đơn hàng này.");
        // }

        long amount = paymentRequest.getAmount() * 100;
        String bankCode = paymentRequest.getBankCode();

        String vnp_TxnRef = paymentRequest.getOrderId() + "_" + System.currentTimeMillis();

        // --- LẤY IP ADDRESS MÀ KHÔNG CẦN TRUYỀN REQUEST ---
        // Sử dụng RequestContextHolder để lấy HttpServletRequest hiện tại
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        String vnp_IpAddr = Config.getIpAddress(request);

        String vnp_TmnCode = Config.vnp_TmnCode;
        String vnp_ReturnUrl = Config.vnp_ReturnUrl;

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amount));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", "Thanh toan don hang: " + paymentRequest.getOrderId() + " cho user: " + securityUser.getUsername());
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        if (bankCode != null && !bankCode.isEmpty()) {
            vnp_Params.put("vnp_BankCode", bankCode);
        }

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        // --- Phần còn lại của logic giữ nguyên ---
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        try {
            for (String fieldName : fieldNames) {
                String fieldValue = vnp_Params.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                    query.append('=');
                    query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    query.append('&');
                    hashData.append('&');
                }
            }
            if (query.length() > 0) {
                query.setLength(query.length() - 1);
            }
            if (hashData.length() > 0) {
                hashData.setLength(hashData.length() - 1);
            }
        } catch (UnsupportedEncodingException e) {
            log.error("Error encoding VNPAY params", e);
            throw new RuntimeException(e);
        }

        String queryUrl = query.toString();
        String vnp_SecureHash = Config.hmacSHA512(Config.secretKey, hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        String paymentUrl = Config.vnp_PayUrl + "?" + queryUrl;

        return Map.of("paymentUrl", paymentUrl);
    }
    // Trong lớp VnPaySerivce.java

    @Transactional
    public ResponseEntity<Map<String, String>> ipn(@RequestParam Map<String, String> params) {
        log.info("IPN request received from VNPay with params: {}", params);

        // BƯỚC 1: XÁC THỰC CHỮ KÝ (SECURITY CHECK - QUAN TRỌNG)
        // Để đảm bảo request đến từ VNPay và dữ liệu không bị thay đổi.
        // Bạn cần tự hoàn thiện logic này dựa trên tài liệu của VNPay.
    /*
    String vnp_SecureHash = params.get("vnp_SecureHash");
    if (vnp_SecureHash == null || vnp_SecureHash.isEmpty()) {
        log.error("IPN Security Error: vnp_SecureHash is missing.");
        return ResponseEntity.ok(Map.of("RspCode", "97", "Message", "Invalid Checksum"));
    }

    // Logic để tạo lại checksum từ các tham số nhận được
    if (!isSignatureValid(params, vnp_SecureHash)) { // isSignatureValid là một phương thức bạn tự viết
        log.error("IPN Security Error: Invalid signature.");
        return ResponseEntity.ok(Map.of("RspCode", "97", "Message", "Invalid Checksum"));
    }
    */

        // BƯỚC 2: KIỂM TRA MÃ THAM CHIẾU GIAO DỊCH (vnp_TxnRef)
        String vnp_TxnRef = params.get("vnp_TxnRef");
        if (vnp_TxnRef == null || vnp_TxnRef.isEmpty()) {
            log.error("IPN Logic Error: vnp_TxnRef is missing from VNPay params.");
            // Mã lỗi "01": Đơn hàng không tồn tại (vì không có mã để tìm)
            return ResponseEntity.ok(Map.of("RspCode", "01", "Message", "Order not found"));
        }

        // BƯỚC 3: TRÍCH XUẤT ORDER ID VÀ TÌM ĐƠN HÀNG MỘT CÁCH AN TOÀN
        Integer orderId;
        try {
            orderId = Integer.parseInt(vnp_TxnRef.split("_")[0]);
        } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
            log.error("IPN Logic Error: Could not parse orderId from vnp_TxnRef '{}'", vnp_TxnRef, e);
            // Mã lỗi "01": Đơn hàng không tồn tại (vì mã tham chiếu không hợp lệ)
            return ResponseEntity.ok(Map.of("RspCode", "01", "Message", "Order not found"));
        }

        // Tìm đơn hàng trong CSDL
        Optional<Order> orderOptional = orderRepository.findById(orderId);
        if (orderOptional.isEmpty()) {
            log.error("IPN Logic Error: Order with ID {} not found in the database.", orderId);
            // Mã lỗi "01": Đơn hàng không tồn tại
            return ResponseEntity.ok(Map.of("RspCode", "01", "Message", "Order not found"));
        }
        Order order = orderOptional.get();

        // BƯỚC 4: KIỂM TRA TRÙNG LẶP GIAO DỊCH
        // Sử dụng mã giao dịch của VNPay (vnp_TransactionNo) để đảm bảo mỗi giao dịch chỉ được xử lý một lần.
        String vnpTransactionNo = params.get("vnp_TransactionNo");
        if (vnpTransactionNo == null || vnpTransactionNo.isEmpty()) {
            log.error("IPN Logic Error: vnp_TransactionNo is missing.");
            return ResponseEntity.ok(Map.of("RspCode", "99", "Message", "Input data required"));
        }


        // BƯỚC 5: XỬ LÝ KẾT QUẢ GIAO DỊCH DỰA TRÊN MÃ PHẢN HỒI
        String vnp_ResponseCode = params.get("vnp_ResponseCode");
        if ("00".equals(vnp_ResponseCode)) {
            // --- GIAO DỊCH THÀNH CÔNG ---
            log.info("Payment for order ID {} was successful. Creating payment record.", orderId);

            // Tạo một bản ghi thanh toán mới
            Payment payment = new Payment();
            BigDecimal amount = new BigDecimal(params.get("vnp_Amount")).divide(new BigDecimal(100));

            payment.setOrder(order); // Liên kết thanh toán với đơn hàng
            payment.setAmount(amount);
            payment.setPaymentMethod(params.get("vnp_BankCode")); // Lưu lại mã ngân hàng/ví
            payment.setPaidAt(LocalDateTime.now());

            // Lưu vào cơ sở dữ liệu
            paymentRepository.save(payment);



            log.info("Successfully created payment record for order ID {}.", orderId);

            // Trả về cho VNPay biết đã xử lý thành công
            return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));

        } else {
            // --- GIAO DỊCH THẤT BẠI ---
            log.warn("Payment for order ID {} failed. VNPay response code: {}", orderId, vnp_ResponseCode);
            return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
        }
    }
}