package com.example.InvoiceManage.config.constants;

public class SecurityConstants {

    // Thay đổi từ 'private' thành 'public'
    public static final String API_PREFIX = "/api"; // Make sure this matches your application.properties api.prefix

    public static final String[] PUBLIC_URLS = {
            API_PREFIX + "/auth/login",
            API_PREFIX + "/auth/register",
            // XÓA DÒNG NÀY NẾU BẠN MUỐN BẢO VỆ NÓ: API_PREFIX + "/users/list",
            // Thêm các URL công khai khác (ví dụ: Swagger UI)
            API_PREFIX + "/swagger-ui/**",
            API_PREFIX + "/v3/api-docs/**",
            API_PREFIX + "/webjars/**",
            API_PREFIX + "/favicon.ico"
    };

    // Other security constants if any
}