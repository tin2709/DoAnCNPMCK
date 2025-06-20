package com.example.InvoiceManage.controller;


import com.example.InvoiceManage.config.constants.SecurityConstants;
import com.example.InvoiceManage.entity.Category;
import com.example.InvoiceManage.entity.SecurityUser;
import com.example.InvoiceManage.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController // Đánh dấu đây là một Rest Controller, tự động chuyển đổi object thành JSON
@RequestMapping(SecurityConstants.API_PREFIX + "/categories") // Dùng số nhiều "products" cho RESTful

public class CategoryController {
    @Autowired
    private  CategoryService categoryService;


    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories(@AuthenticationPrincipal SecurityUser securityUser) {
        List<Category> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories); // Trả về danh sách và HTTP Status 200
    }
}