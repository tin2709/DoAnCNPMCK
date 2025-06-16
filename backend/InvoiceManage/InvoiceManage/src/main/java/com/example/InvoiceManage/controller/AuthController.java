package com.example.InvoiceManage.controller;

import com.example.InvoiceManage.DTO.request.LoginRequest;
import com.example.InvoiceManage.DTO.request.RegisterRequest;
import com.example.InvoiceManage.DTO.response.UserResponse;
import com.example.InvoiceManage.entity.User;
import com.example.InvoiceManage.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController
@RequestMapping("${api.prefix}/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    @Autowired
    private UserService userService;

@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    Optional<UserResponse> userOpt = userService.login(request);
    if (userOpt.isPresent()) {
        return ResponseEntity.ok(userOpt.get());
    } else {
        return ResponseEntity.status(401).body("Sai email hoặc mật khẩu");
    }
}

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User user = userService.register(request);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
