package com.ernoxin.atency.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class ErrorResult {
    private String message;
    private String path;
    private Map<String, String> validationErrors;
}
