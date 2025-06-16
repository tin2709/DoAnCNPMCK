package com.example.InvoiceManage.service;

import com.example.InvoiceManage.entity.User;
import com.example.InvoiceManage.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.InvoiceManage.DTO.request.LoginRequest;
import com.example.InvoiceManage.DTO.request.RegisterRequest;
import com.example.InvoiceManage.DTO.response.UserResponse;
import com.example.InvoiceManage.entity.Role;
import com.example.InvoiceManage.repository.RoleRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.Optional;
import java.util.List;

@Service
public class UserService {
    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public List<User> getUsers(){
        return userRepository.findAll();
    }

    public Optional<UserResponse> login(LoginRequest request) {
    Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
    if (userOpt.isPresent()) {
        User user = userOpt.get();
        if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            UserResponse response = new UserResponse();
            response.setId(user.getId());
            response.setEmail(user.getEmail());
            response.setName(user.getName());
            response.setRole(user.getRole());
            response.setPhone(user.getPhone());
            response.setActive(user.getActive());
            response.setPicture(user.getPicture());
            // response.setRole1(...);
            return Optional.of(response);
        }
    }
    return Optional.empty();
}

    public User register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setActive(true);
        // Gán role mặc định (ví dụ: role_id = 2 là USER)
        Role role = roleRepository.findById(2).orElseThrow(() -> new IllegalArgumentException("Role không tồn tại"));
        user.setRole(role);
        return userRepository.save(user);
    }
}
