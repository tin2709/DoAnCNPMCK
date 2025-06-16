package com.example.InvoiceManage.entity; // Recommended package for security-related classes

import com.example.InvoiceManage.entity.User; // Import your User entity
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional; // For safer handling of potentially null Role or roleName

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SecurityUser implements UserDetails {

    private Integer userId; // Matches User.id type
    private String email;
    private String password;
    private Collection<? extends GrantedAuthority> authorities;

    // These will be derived from the 'active' field of the User entity
    private Boolean isAccountNonExpired;
    private Boolean isAccountNonLocked;
    private Boolean isCredentialsNonExpired;
    private Boolean isEnabled;

    private String roleName; // To store the raw role name, e.g., "ADMIN", "USER"

    /**
     * Builds a SecurityUser object from an InvoiceManage.entity.User.
     * This method maps the entity properties to Spring Security's UserDetails contract.
     *
     * @param user The User entity from your database.
     * @return A SecurityUser object implementing UserDetails.
     */
    public static SecurityUser build(User user) {
        // 1. Determine the user's role name
        // Assuming your Role entity has a getRoleName() method (e.g., "ADMIN", "USER")
        String userRoleName = Optional.ofNullable(user.getRole())
                .map(role -> role.getRoleName())
                .orElse("USER"); // Default to "USER" if role or roleName is null

        // 2. Create authorities list for Spring Security
        // It's common practice in Spring Security to prefix roles with "ROLE_"
        List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + userRoleName.toUpperCase()));

        // 3. Determine account status flags based on the 'active' field
        // If 'active' is true, the account is enabled and not locked.
        // If 'active' is false (or null), the account is disabled and locked.
        boolean isActive = Boolean.TRUE.equals(user.getActive()); // Safely handle null Boolean

        return new SecurityUser(
                user.getId(),           // userId
                user.getEmail(),        // email (used as username by Spring Security)
                user.getPassword(),     // password (hashed password)
                authorities,
                true,                   // isAccountNonExpired (often true by default unless specific expiration logic)
                isActive,               // isAccountNonLocked (derived from 'active')
                true,                   // isCredentialsNonExpired (often true by default unless specific expiration logic)
                isActive,               // isEnabled (derived from 'active')
                userRoleName            // The raw role name (e.g., "ADMIN", "USER")
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email; // Using email as the username for Spring Security
    }

    @Override
    public boolean isAccountNonExpired() {
        return isAccountNonExpired;
    }

    @Override
    public boolean isAccountNonLocked() {
        return isAccountNonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return isCredentialsNonExpired;
    }

    @Override
    public boolean isEnabled() {
        return isEnabled;
    }

    // Custom getter to easily access the raw role name if needed elsewhere
    public String getRoleName() {
        return roleName;
    }
}