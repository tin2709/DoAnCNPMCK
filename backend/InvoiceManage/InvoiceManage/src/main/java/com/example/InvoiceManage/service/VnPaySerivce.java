package com.example.InvoiceManage.service;

import com.example.InvoiceManage.DTO.VnPayIpnData;
import com.example.InvoiceManage.DTO.request.PaymentRequest;
import com.example.InvoiceManage.entity.Invoice;
import com.example.InvoiceManage.entity.Payment;
import com.example.InvoiceManage.repository.PaymentRepository;
import com.example.InvoiceManage.util.Config;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class VnPaySerivce {

    @Autowired
    private PaymentRepository paymentRepository;
    public Map<String, String> createOrder(PaymentRequest paymentRequest, HttpServletRequest request) throws IOException {
        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String orderType = "other";
        long amount = paymentRequest.getAmount() * 100;
        String bankCode = paymentRequest.getBankCode(); // method thanh toan

        String vnp_TxnRef = Config.getRandomNumber(8); // ma tham chieu cua he thong vnpay
        String vnp_IpAddr = Config.getIpAddress(request);
        String vnp_TmnCode = Config.vnp_TmnCode;

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amount));
        vnp_Params.put("vnp_CurrCode", "VND");

        vnp_Params.put("vnp_Locale", "vn");

        if (bankCode != null && !bankCode.isEmpty()) {
            vnp_Params.put("vnp_BankCode", bankCode);
        }

        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", "Thanh toan don hang:" + vnp_TxnRef +"##InvoiceRequestId:"+ paymentRequest.getInvoiceRequestId());
//        vnp_Params.put("vnp_InvoiceRequestId", String.valueOf(paymentRequest.getInvoiceRequestId()));

        vnp_Params.put("vnp_OrderType", orderType);
        vnp_Params.put("vnp_ReturnUrl", Config.vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        // Thiết lập thời gian thanh toán: 15 phút
        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);


        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = (String) itr.next();
            String fieldValue = (String) vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                //Build hash data
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                //Build query
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }


        String queryUrl = query.toString();
        String vnp_SecureHash = Config.hmacSHA512(Config.secretKey, hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;

        String paymentUrl = Config.vnp_PayUrl + "?" + queryUrl;
        Map<String, String> dataReturn = Map.of(
                "code", "00",
                "message", "success",
                "data", paymentUrl
        );
        return dataReturn;
    }

    public ResponseEntity<Void> ipn(@RequestParam Map<String, String> params) {

        ObjectMapper mapper = new ObjectMapper();
        VnPayIpnData ipnData = mapper.convertValue(params, VnPayIpnData.class);
        String orderInfo = ipnData.getVnp_OrderInfo();String[] parts = orderInfo.split("##");
        int invoiceId;
        if (parts.length > 1) {
            String invoicePart = parts[1];  // "InvoiceRequestId:1"
            String[] keyValue = invoicePart.split(":");
            if (keyValue.length > 1) {
                String invoiceIdStr = keyValue[1]; // "1"
                invoiceId = Integer.parseInt(invoiceIdStr);

                PaymentRequest paymentRequest = PaymentRequest.builder()
                        .invoiceRequestId(invoiceId)
                        .amount(Integer.parseInt(ipnData.getVnp_Amount()))
                        .bankCode(ipnData.getVnp_BankCode())
                        .build();
                System.out.println("paymentRequest : " + paymentRequest);

                Payment payment = new Payment();
                payment.setAmount(BigDecimal.valueOf(paymentRequest.getAmount())); // Chuyển sang BigDecimal
                payment.setPaymentMethod(paymentRequest.getBankCode());
                payment.setPaidAt(LocalDateTime.now());

// Giả sử bạn đã có Invoice từ id (trong thực tế bạn cần fetch từ repository):
                Invoice invoice = new Invoice();
                invoice.setId(paymentRequest.getInvoiceRequestId()); // ⚠️ chỉ set id, cần đảm bảo entity tồn tại thật
                payment.setInvoice(invoice);

                paymentRepository.save(payment); // ✅ OK
            }
        }
        return null;
    }


}
