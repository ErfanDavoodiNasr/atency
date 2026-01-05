package com.ernoxin.atency.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

public class RequestTraceLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestTraceLoggingFilter.class);

    private static final Set<String> SENSITIVE_KEYS = Set.of(
            "password",
            "pass",
            "pwd",
            "token",
            "access_token",
            "refresh_token",
            "authorization",
            "auth",
            "secret",
            "jwt",
            "apikey",
            "api_key",
            "api-key"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String referenceId = resolveReferenceId(request);
        MDC.put(ReferenceIdUtil.MDC_KEY, referenceId);
        response.setHeader(ReferenceIdUtil.HEADER_NAME, referenceId);

        Instant startTime = Instant.now();
        long startNs = System.nanoTime();
        boolean failed = false;
        try {
            filterChain.doFilter(request, response);
        } catch (RuntimeException | IOException | ServletException ex) {
            failed = true;
            throw ex;
        } finally {
            int status = response.getStatus();
            if (failed && status < 400) {
                status = HttpServletResponse.SC_INTERNAL_SERVER_ERROR;
            }
            long durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startNs);
            String username = resolveUsername();
            String params = formatParameters(request.getParameterMap());
            logByStatus(status, referenceId, request.getMethod(), request.getRequestURI(),
                    params, username, startTime, durationMs);
            MDC.clear();
        }
    }

    private String resolveReferenceId(HttpServletRequest request) {
        String header = request.getHeader(ReferenceIdUtil.HEADER_NAME);
        if (header != null && !header.isBlank()) {
            return header.trim();
        }
        return UUID.randomUUID().toString();
    }

    private String resolveUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "anonymous";
        }
        String name = authentication.getName();
        if (name == null || "anonymousUser".equalsIgnoreCase(name)) {
            return "anonymous";
        }
        return name;
    }

    private String formatParameters(Map<String, String[]> parameterMap) {
        if (parameterMap == null || parameterMap.isEmpty()) {
            return "-";
        }
        Map<String, String[]> sorted = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        sorted.putAll(parameterMap);

        StringBuilder builder = new StringBuilder();
        for (Map.Entry<String, String[]> entry : sorted.entrySet()) {
            if (builder.length() > 0) {
                builder.append("&");
            }
            String key = entry.getKey();
            builder.append(key).append("=");
            if (isSensitive(key)) {
                builder.append("REDACTED");
                continue;
            }
            String[] values = entry.getValue();
            if (values == null || values.length == 0) {
                builder.append("-");
            } else {
                builder.append(String.join(",", values));
            }
        }
        return builder.toString();
    }

    private boolean isSensitive(String key) {
        if (key == null) {
            return false;
        }
        String lowered = key.toLowerCase(Locale.ROOT);
        for (String sensitive : SENSITIVE_KEYS) {
            if (lowered.contains(sensitive)) {
                return true;
            }
        }
        return false;
    }

    private void logByStatus(int status, String referenceId, String method, String uri,
                             String params, String username, Instant startTime, long durationMs) {
        if (status >= 500) {
            log.error("Request completed referenceId={} method={} uri={} params={} user={} startTime={} status={} durationMs={}",
                    referenceId, method, uri, params, username, startTime, status, durationMs);
        } else if (status >= 400) {
            log.warn("Request completed referenceId={} method={} uri={} params={} user={} startTime={} status={} durationMs={}",
                    referenceId, method, uri, params, username, startTime, status, durationMs);
        } else {
            log.info("Request completed referenceId={} method={} uri={} params={} user={} startTime={} status={} durationMs={}",
                    referenceId, method, uri, params, username, startTime, status, durationMs);
        }
    }
}
