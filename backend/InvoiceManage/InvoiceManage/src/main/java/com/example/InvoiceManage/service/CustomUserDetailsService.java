// src/main/java/com/example/InvoiceManage/service/CustomUserDetailsService.java (or where your service is)
package com.example.InvoiceManage.service;

import com.example.InvoiceManage.entity.User;
import com.example.InvoiceManage.repository.UserRepository;
import com.example.InvoiceManage.entity.SecurityUser; // Your SecurityUser class
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor // For constructor injection of UserRepository
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository; // Inject UserRepository

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException { // Parameter name changed to email for clarity
        // CORRECTED HERE: Load user by email, matching SecurityUser's getUsername()
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        return SecurityUser.build(user);
    }
}