package com.example.InvoiceManage.security.filter; // Adjust package if different

import com.example.InvoiceManage.config.constants.SecurityConstants; // IMPORT THIS
import com.example.InvoiceManage.security.jwt.JwtService;
import com.example.InvoiceManage.service.CustomUserDetailsService; // Corrected import for your UserDetailsService
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse; // Correct import for HttpServletResponse
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher; // Import this for path matching
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;


import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService; // Autowire your CustomUserDetailsService
    private final AntPathMatcher antPathMatcher = new AntPathMatcher(); // Initialize AntPathMatcher

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String requestPath = request.getServletPath(); // Get the actual request path, e.g., "/register"

        // =========================================================================
        // CRITICAL LOGIC: Check if the request path matches any of the public URLs
        // If it's a public URL, skip the JWT validation and proceed to the next filter
        // =========================================================================
        for (String publicUrlPattern : SecurityConstants.PUBLIC_URLS) {
            if (antPathMatcher.match(publicUrlPattern, requestPath)) {
                // If the current request path matches a public URL pattern
                // System.out.println("Skipping JWT validation for public URL: " + requestPath); // Optional: for debugging
                filterChain.doFilter(request, response); // Proceed to the next filter in the chain
                return; // IMPORTANT: Immediately stop processing in this filter
            }
        }

        // If we reach here, it means the URL is NOT public, so proceed with JWT validation
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // If Authorization header is missing or doesn't start with "Bearer ",
        // for non-public URLs, it's an unauthorized request.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // CORRECTED HERE
            response.getWriter().write("JWT token is missing or malformed");
            return; // Stop processing the request here
        }

        jwt = authHeader.substring(7); // Extract token after "Bearer "

        try {
            userEmail = jwtService.extractUsername(jwt);
            // If user email is extracted and no authentication is currently set in context
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null, // credentials (password) are not needed here once authenticated
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken); // Set authentication in Spring Security context
                } else {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // CORRECTED HERE
                    response.getWriter().write("Invalid JWT token for user " + userEmail);
                    return;
                }
            }
        } catch (ExpiredJwtException e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // CORRECTED HERE
            response.getWriter().write("JWT token has expired");
            return;
        } catch (MalformedJwtException | SignatureException | IllegalArgumentException e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // CORRECTED HERE
            response.getWriter().write("Invalid JWT token: " + e.getMessage());
            return;
        }

        filterChain.doFilter(request, response); // Continue the filter chain for authenticated requests
    }
}