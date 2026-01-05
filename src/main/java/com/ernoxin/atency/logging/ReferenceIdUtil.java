package com.ernoxin.atency.logging;

import org.slf4j.MDC;

import java.util.UUID;

public final class ReferenceIdUtil {

    public static final String MDC_KEY = "referenceId";
    public static final String HEADER_NAME = "X-Reference-Id";

    private ReferenceIdUtil() {
    }

    public static String resolveOrGenerate() {
        String referenceId = MDC.get(MDC_KEY);
        if (referenceId == null || referenceId.isBlank()) {
            return UUID.randomUUID().toString();
        }
        return referenceId;
    }
}
