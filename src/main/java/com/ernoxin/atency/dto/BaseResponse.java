package com.ernoxin.atency.dto;

import lombok.Builder;
import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class BaseResponse<T> {
    private Instant timestamp;
    private int code;
    private String status;
    private String referenceId;
    private T result;

    public static <T> BaseResponse<T> of(HttpStatus status, T result) {
        return BaseResponse.<T>builder()
                .timestamp(Instant.now())
                .code(status.value())
                .status(status.getReasonPhrase())
                .referenceId(UUID.randomUUID().toString())
                .result(result)
                .build();
    }
}
