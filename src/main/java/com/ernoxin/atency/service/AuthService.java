package com.ernoxin.atency.service;

import com.ernoxin.atency.dto.AuthResponse;
import com.ernoxin.atency.dto.LoginRequest;
import com.ernoxin.atency.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}
