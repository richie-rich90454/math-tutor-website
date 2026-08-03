package com.mathtutor;

import com.mathtutor.web.RequestSecurity;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RequestSecurityTest {

    private final List<String> allowed = List.of("http://localhost:3000");

    private HttpServletRequest request(String scheme, String host, int port, String origin) {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getScheme()).thenReturn(scheme);
        when(req.getServerName()).thenReturn(host);
        when(req.getServerPort()).thenReturn(port);
        when(req.getHeader("Origin")).thenReturn(origin);
        return req;
    }

    @Test
    void allowsMissingOrigin() {
        assertTrue(RequestSecurity.isAllowedOrigin(request("http", "localhost", 8080, null), allowed));
    }

    @Test
    void allowsSameOriginNotInAllowlist() {
        assertTrue(RequestSecurity.isAllowedOrigin(request("http", "localhost", 8080, "http://localhost:8080"), allowed));
    }

    @Test
    void allowsConfiguredCrossOrigin() {
        assertTrue(RequestSecurity.isAllowedOrigin(request("http", "localhost", 8080, "http://localhost:3000"), allowed));
    }

    @Test
    void blocksCrossOriginNotInAllowlist() {
        assertFalse(RequestSecurity.isAllowedOrigin(request("http", "localhost", 8080, "http://evil.example"), allowed));
    }

    @Test
    void allowsDefaultPortOriginWithoutPort() {
        assertTrue(RequestSecurity.isAllowedOrigin(request("https", "math-tutor.ai", 443, "https://math-tutor.ai"), allowed));
    }
}
