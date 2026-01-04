package com.ernoxin.atency.service.impl;

import com.ernoxin.atency.dto.AuthResponse;
import com.ernoxin.atency.dto.LoginRequest;
import com.ernoxin.atency.dto.RegisterRequest;
import com.ernoxin.atency.entity.Role;
import com.ernoxin.atency.entity.User;
import com.ernoxin.atency.exception.BadRequestException;
import com.ernoxin.atency.repository.UserRepository;
import com.ernoxin.atency.security.JwtService;
import com.ernoxin.atency.security.UserPrincipal;
import com.ernoxin.atency.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(Role.EMPLOYEE)
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(UserPrincipal.fromUser(user));
        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtService.generateToken(principal);

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .username(principal.getUsername())
                .role(principal.getRole())
                .build();
    }
}
