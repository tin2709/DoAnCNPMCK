// File: com.example.InvoiceManage.service.UserService.java
package com.example.InvoiceManage.service;

import com.example.InvoiceManage.DTO.request.LoginRequest;
import com.example.InvoiceManage.DTO.request.UserRegistrationRequest;
import com.example.InvoiceManage.DTO.response.UserResponse; // Keep if you use it elsewhere, or remove if only LoginResponse is needed for login
import com.example.InvoiceManage.entity.User;
import com.example.InvoiceManage.entity.Role;
import com.example.InvoiceManage.repository.UserRepository;
import com.example.InvoiceManage.repository.RoleRepository;
import com.example.InvoiceManage.exception.AlreadyExistsException;
import com.example.InvoiceManage.security.jwt.JwtService; // IMPORT JwtService
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails; // IMPORT UserDetails
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; // Consider using Spring's PasswordEncoder bean
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

    @Autowired // Inject JwtService
    private JwtService jwtService;

    @Autowired // Inject CustomUserDetailsService to get UserDetails object
    private CustomUserDetailsService userDetailsService;

    // It's generally better to @Autowired PasswordEncoder from your SecurityConfig
    // if you have it defined as a @Bean there, instead of instantiating it directly.
    // For now, keeping as is, but be aware of the best practice.
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public List<User> getUsers(){
        return userRepository.findAll();
    }

    public Optional<UserResponse> login(LoginRequest request) { // CHANGE RETURN TYPE TO LoginResponse
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Ensure the user is active AND password matches
            if (user.getActive() && passwordEncoder.matches(request.getPassword(), user.getPassword())) {

                // Get UserDetails for token generation.
                // Assuming CustomUserDetailsService can load UserDetails by email.
                UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());

                // Generate JWT tokens
                String accessToken = jwtService.generateToken(userDetails);
                String refreshToken = jwtService.generateRefreshToken(userDetails);

                // Populate the new LoginResponse DTO
                UserResponse loginResponse = new UserResponse();
                loginResponse.setId(Long.valueOf(user.getId()));
                loginResponse.setEmail(user.getEmail());
                loginResponse.setName(user.getName());
                loginResponse.setRole(user.getRole()); // Direct use of Role entity
                loginResponse.setAccessToken(accessToken);

                return Optional.of(loginResponse); // Return the LoginResponse
            }
        }
        return Optional.empty(); // Returns empty for invalid credentials or inactive user
    }

    public User register(UserRegistrationRequest request) {
        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AlreadyExistsException("Email '" + request.getEmail() + "' already exists.");
        }
        // Assuming 'name' field in User entity is for username
        if (userRepository.findByName(request.getUsername()).isPresent()) {
            throw new AlreadyExistsException("Username '" + request.getUsername() + "' already exists.");
        }

        Role defaultRole = roleRepository.findByRoleName(DEFAULT_USER_ROLE_NAME)
                .orElseThrow(() -> new IllegalStateException("Default role '" + DEFAULT_USER_ROLE_NAME + "' not found in database. " +
                        "Please ensure a role with this name exists for new user registrations."));

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getUsername()); // Map DTO's username to entity's 'name' field
        user.setActive(true); // New users are active by default

        user.setRole(defaultRole);

        return userRepository.save(user);
    }
}