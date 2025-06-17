package com.example.InvoiceManage.controller;

import com.example.InvoiceManage.DTO.response.UserResponse;
import com.example.InvoiceManage.entity.SecurityUser;
import com.example.InvoiceManage.entity.User;
import com.example.InvoiceManage.service.UserService;
import com.example.InvoiceManage.config.constants.SecurityConstants;
import com.example.InvoiceManage.exception.ResourceNotFoundException; // <-- IMPORT NÀY
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // <-- IMPORT NÀY
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable; // <-- IMPORT NÀY
import org.springframework.web.bind.annotation.PutMapping; // <-- IMPORT NÀY
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(SecurityConstants.API_PREFIX + "/users")
public class UserController {
    @Autowired
    private UserService userService;

    // Ví dụ: Chỉ ADMIN mới có thể xem danh sách người dùng
    @GetMapping("/list")
    @PreAuthorize("hasRole('ADMIN')") // Yêu cầu vai trò ADMIN để truy cập
    public ResponseEntity<List<User>> getAllUsers(@AuthenticationPrincipal SecurityUser securityUser) {
        List<User> users = userService.getUsers();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }


    @PutMapping("/{userId}/ban") // Sử dụng PUT mapping cho việc cập nhật trạng thái
    @PreAuthorize("hasRole('ADMIN')") // Chỉ người dùng có quyền ADMIN mới có thể thực hiện
    public ResponseEntity<?> banUser(@PathVariable Integer userId, @AuthenticationPrincipal SecurityUser securityUser) {
        try {
            // Optional: Ngăn người dùng tự ban chính mình
            if (securityUser.getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("You cannot ban your own account.");
            }

            User bannedUser = userService.banUser(userId);
            return ResponseEntity.ok(bannedUser);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            // Xử lý các lỗi không mong muốn khác
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred while banning user: " + e.getMessage());
        }
    }


    @PutMapping("/{userId}/unban") // Sử dụng PUT mapping cho việc cập nhật trạng thái
    @PreAuthorize("hasRole('ADMIN')") // Chỉ người dùng có quyền ADMIN mới có thể thực hiện
    public ResponseEntity<?> unbanUser(@PathVariable Integer userId, @AuthenticationPrincipal SecurityUser securityUser) {
        try {
            User unbannedUser = userService.unbanUser(userId);
            return ResponseEntity.ok(unbannedUser);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            // Xử lý các lỗi không mong muốn khác
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred while unbanning user: " + e.getMessage());
        }
    }
}