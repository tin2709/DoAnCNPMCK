// File: com.example.InvoiceManage.service.UserService.java
package com.example.InvoiceManage.service;

import com.example.InvoiceManage.DTO.request.LoginRequest;
import com.example.InvoiceManage.DTO.request.UserRegistrationRequest;
import com.example.InvoiceManage.DTO.response.UserResponse;
import com.example.InvoiceManage.entity.User;
import com.example.InvoiceManage.entity.Role;
import com.example.InvoiceManage.exception.UserAccountDeactivatedException;
import com.example.InvoiceManage.repository.UserRepository;
import com.example.InvoiceManage.repository.RoleRepository;
import com.example.InvoiceManage.exception.AlreadyExistsException;
import com.example.InvoiceManage.exception.ResourceNotFoundException; // <-- IMPORT NÀY
import com.example.InvoiceManage.security.jwt.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.List;

@Service
public class UserService {
    private static final String DEFAULT_USER_ROLE_NAME = "USER";

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public List<User> getUsers(){
        return userRepository.findAll();
    }

    public Optional<UserResponse> login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // 1. Kiểm tra mật khẩu trước
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return Optional.empty(); // Mật khẩu không đúng
            }

            // 2. Mật khẩu đúng, bây giờ kiểm tra trạng thái active
            if (!user.getActive()) {
                // Nếu tài khoản không hoạt động, ném exception cụ thể
                throw new UserAccountDeactivatedException("Tài khoản của bạn đã bị quản trị viên chặn.");
            }

            // 3. Nếu mọi thứ đều OK, tiến hành đăng nhập thành công
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());

            String accessToken = jwtService.generateToken(userDetails);
            String refreshToken = jwtService.generateRefreshToken(userDetails); // Giả sử bạn có RefreshToken

            UserResponse loginResponse = new UserResponse();
            loginResponse.setId(Long.valueOf(user.getId()));
            loginResponse.setEmail(user.getEmail());
            loginResponse.setName(user.getName());
            loginResponse.setRole(user.getRole());
            loginResponse.setAccessToken(accessToken);

            return Optional.of(loginResponse);
        }
        return Optional.empty(); // Không tìm thấy người dùng với email này
    }

    public User register(UserRegistrationRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AlreadyExistsException("Email '" + request.getEmail() + "' already exists.");
        }
        if (userRepository.findByName(request.getUsername()).isPresent()) {
            throw new AlreadyExistsException("Username '" + request.getUsername() + "' already exists.");
        }

        Role defaultRole = roleRepository.findByRoleName(DEFAULT_USER_ROLE_NAME)
                .orElseThrow(() -> new IllegalStateException("Default role '" + DEFAULT_USER_ROLE_NAME + "' not found in database. " +
                        "Please ensure a role with this name exists for new user registrations."));

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getUsername());
        user.setActive(true);

        user.setRole(defaultRole);

        return userRepository.save(user);
    }

    public User banUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        user.setActive(false); // Set active to false (0)
        return userRepository.save(user);
    }

    public User unbanUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        user.setActive(true); // Set active to true (1)
        return userRepository.save(user);
    }
}