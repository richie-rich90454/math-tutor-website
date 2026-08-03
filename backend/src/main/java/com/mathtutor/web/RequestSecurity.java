package com.mathtutor.web;

import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

/**
 * Request-level security helpers.
 *
 * Client IPs: forwarded headers (X-Forwarded-For / X-Real-IP) are only
 * trusted when the deployment sets TRUST_PROXY=true (i.e. the app sits behind
 * a proxy that overwrites those headers). Otherwise rate limiting keys on the
 * socket remote address, which clients cannot spoof. This prevents both
 * rate-limit bypass via forged headers and the shared "unknown" bucket.
 *
 * Origin checks: state-changing requests from a browser carry an Origin
 * header on cross-origin requests; same-origin requests do not. Verifying the
 * Origin (when present) against the configured allowed origins is a CSRF
 * defense in depth on top of SameSite cookies.
 */
public final class RequestSecurity {

    private RequestSecurity() {
    }

    public static String clientIp(HttpServletRequest request) {
        if (isTrustProxy()) {
            String forwarded = request.getHeader("x-forwarded-for");
            if (forwarded != null && !forwarded.isBlank()) {
                int comma = forwarded.indexOf(',');
                String first = comma > 0 ? forwarded.substring(0, comma) : forwarded;
                return first.trim();
            }
            String realIp = request.getHeader("x-real-ip");
            if (realIp != null && !realIp.isBlank()) {
                return realIp.trim();
            }
        }
        String remote = request.getRemoteAddr();
        return remote == null || remote.isBlank() ? "unknown" : remote;
    }

    public static boolean isAllowedOrigin(HttpServletRequest request, List<String> allowedOrigins) {
        String origin = request.getHeader("Origin");
        if (origin == null || origin.isBlank()) {
            return true;
        }
        return allowedOrigins.contains(origin);
    }

    private static boolean isTrustProxy() {
        return "true".equalsIgnoreCase(System.getenv("TRUST_PROXY"));
    }
}
