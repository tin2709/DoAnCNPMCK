package com.example.InvoiceManage.controller;

import com.example.InvoiceManage.DTO.response.ProductResponse;
import com.example.InvoiceManage.config.constants.SecurityConstants; // Giả sử bạn có file này
import com.example.InvoiceManage.entity.SecurityUser;
import com.example.InvoiceManage.exception.ResourceNotFoundException;
import com.example.InvoiceManage.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
// THAY ĐỔI 1: Sử dụng prefix nhất quán với UserController
@RequestMapping(SecurityConstants.API_PREFIX + "/products") // Dùng số nhiều "products" cho RESTful
public class ProductController {

    @Autowired
    private ProductService productService;

    @GetMapping
    public ResponseEntity<?> listProducts(@RequestParam(required = false) Boolean active, @AuthenticationPrincipal SecurityUser securityUser) {
        try {
            List<ProductResponse> products;
            if (active != null && active) {
                products = productService.getActiveProducts();
            } else {
                products = productService.getAllProducts();
            }
            // THAY ĐỔI 2: Khởi tạo ResponseEntity một cách tường minh
            return new ResponseEntity<>(products, HttpStatus.OK);
        } catch (Exception e) {
            // THAY ĐỔI 3: Bắt các lỗi chung và trả về 500
            return new ResponseEntity<>("An error occurred while fetching products: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<?> listProductsByCategory(@PathVariable Integer categoryId, @AuthenticationPrincipal SecurityUser securityUser) {
        try {
            List<ProductResponse> products = productService.getProductsByCategoryId(categoryId);
            // Trả về thành công
            return new ResponseEntity<>(products, HttpStatus.OK);
        } catch (ResourceNotFoundException e) {
            // THAY ĐỔI 4: Bắt lỗi cụ thể khi không tìm thấy category
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            // Bắt các lỗi chung khác
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred while fetching products by category: " + e.getMessage());
        }
    }
}