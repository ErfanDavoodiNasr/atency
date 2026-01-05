package com.ernoxin.atency.dto;

import com.ernoxin.atency.logging.ReferenceIdUtil;
import lombok.Builder;
import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.time.Instant;

@Getter
@Builder
public class BaseResponse<T> {
    private Instant timestamp;
    private int code;
    private String status;
    private String referenceId;
    private T result;

    public static <T> BaseResponse<T> of(HttpStatus status, T result) {
        return of(status, result, ReferenceIdUtil.resolveOrGenerate());
    }

    public static <T> BaseResponse<T> of(HttpStatus status, T result, String referenceId) {
        String resolvedReferenceId = (referenceId == null || referenceId.isBlank())
                ? ReferenceIdUtil.resolveOrGenerate()
                : referenceId;
        return BaseResponse.<T>builder()
                .timestamp(Instant.now())
                .code(status.value())
                .status(status.getReasonPhrase())
                .referenceId(resolvedReferenceId)
                .result(result)
                .build();
    }
}
