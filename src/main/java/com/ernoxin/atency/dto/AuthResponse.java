package com.ernoxin.atency.dto;

import com.ernoxin.atency.entity.Role;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {
    private String accessToken;
    private String tokenType;
    private String username;
    private Role role;
}
