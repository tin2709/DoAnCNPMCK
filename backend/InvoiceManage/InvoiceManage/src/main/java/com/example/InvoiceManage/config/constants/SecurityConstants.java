package com.example.InvoiceManage.config.constants;

public class SecurityConstants {

    private static final String API_PREFIX = "/api"; // Make sure this matches your application.properties api.prefix

    public static final String[] PUBLIC_URLS = {
            API_PREFIX + "/auth/login",
            API_PREFIX + "/auth/register",
            // Add any other public URLs here (Swagger, etc.)
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/webjars/**",
            "/favicon.ico"
    };

    // Other security constants if any
}