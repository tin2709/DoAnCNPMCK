package com.example.InvoiceManage.service;

import com.example.InvoiceManage.entity.Order;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class PaymentService {

    /**
     * Tạo một phiên thanh toán Stripe cho một đơn hàng.
     * @param order Đơn hàng cần thanh toán.
     * @param successUrl URL chuyển hướng khi thanh toán thành công.
     * @param cancelUrl URL chuyển hướng khi hủy thanh toán.
     * @return Đối tượng Session của Stripe.
     * @throws StripeException
     */
    public Session createOrderCheckoutSession(Order order, String successUrl, String cancelUrl) throws StripeException {
        // Stripe làm việc với đơn vị nhỏ nhất (cents cho USD, không có phần thập phân cho VND)
        // Ta cần chuyển đổi `BigDecimal` total sang `long`. Ví dụ: 15.50 USD -> 1550 cents.
        long amountInCents = order.getTotal().multiply(new BigDecimal("100")).longValue();

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                // Thay đổi 'usd' thành 'vnd' nếu tài khoản Stripe của bạn hỗ trợ
                                .setCurrency("usd")
                                .setUnitAmount(amountInCents)
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName("Thanh toán cho Đơn hàng #" + order.getId())
                                        .build())
                                .build())
                        .build())
                // Đính kèm metadata để Webhook biết đơn hàng nào đã được thanh toán
                .putMetadata("orderId", String.valueOf(order.getId()))
                .putMetadata("userId", String.valueOf(order.getCreatedBy().getId()))
                .build();

        return Session.create(params);
    }
}