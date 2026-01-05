package com.ernoxin.atency.dto;

import com.ernoxin.atency.logging.ReferenceIdUtil;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.Map;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {
    private String referenceId;
    private String timestamp;
    private int status;
    private String error;
    private String message;
    private String path;
    private Map<String, String> errors;

    public static ApiErrorResponse of(HttpStatus status, String message, String path, Map<String, String> errors) {
        return ApiErrorResponse.builder()
                .referenceId(ReferenceIdUtil.resolveOrGenerate())
                .timestamp(Instant.now().toString())
                .status(status.value())
                .error(status.name())
                .message(message)
                .path(path)
                .errors(errors)
                .build();
    }
}
