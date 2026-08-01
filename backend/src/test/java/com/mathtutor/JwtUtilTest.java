package com.mathtutor;

import com.mathtutor.config.AppProperties;
import com.mathtutor.security.JwtUtil;
import com.mathtutor.security.SecurityUtil;
import org.junit.jupiter.api.Test;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class JwtUtilTest {

    private AppProperties props() {
        return new AppProperties(
                new AppProperties.Database("./data/test.db"),
                new AppProperties.Auth("test-secret-key-for-junit-at-least-256-bits"),
                new AppProperties.Ai("", "https://api.deepseek.com", "deepseek-v4-flash", null),
                new AppProperties.Cors(java.util.List.of("http://localhost:3000")),
                new AppProperties.Prompts("prompts"),
                new AppProperties.Legacy("../frontend-legacy"));
    }

    @Test
    void signAndVerifyTokenRoundTrips() {
        JwtUtil jwt = new JwtUtil(new SecurityUtil(), new ObjectMapper(), props());
        String token = jwt.signToken("user123", "test@example.com");
        JsonNode payload = jwt.verifyToken(token);
        assertNotNull(payload);
        assertEquals("user123", payload.get("sub").asText());
        assertEquals("test@example.com", payload.get("email").asText());
    }

    @Test
    void tokenIncludesIatAndExp() {
        JwtUtil jwt = new JwtUtil(new SecurityUtil(), new ObjectMapper(), props());
        String token = jwt.signToken("user123", "test@example.com");
        JsonNode payload = jwt.verifyToken(token);
        assertNotNull(payload);
        assertTrue(payload.has("iat"));
        assertTrue(payload.has("exp"));
    }

    @Test
    void rejectsInvalidTokenStructure() {
        JwtUtil jwt = new JwtUtil(new SecurityUtil(), new ObjectMapper(), props());
        assertNull(jwt.verifyToken("invalid.token.here"));
    }

    @Test
    void rejectsTamperedToken() {
        JwtUtil jwt = new JwtUtil(new SecurityUtil(), new ObjectMapper(), props());
        String token = jwt.signToken("user123", "test@example.com");
        String[] parts = token.split("\\.");
        parts[2] = "tampered";
        assertNull(jwt.verifyToken(String.join(".", parts)));
    }

    @Test
    void rejectsTokenSignedWithWrongSecret() {
        AppProperties a = props();
        AppProperties b = new AppProperties(
                a.database(),
                new AppProperties.Auth("a-different-secret-key-256-bits-long-xxxx"),
                a.ai(),
                a.cors(),
                a.prompts(),
                a.legacy());
        JwtUtil signer = new JwtUtil(new SecurityUtil(), new ObjectMapper(), a);
        JwtUtil verifier = new JwtUtil(new SecurityUtil(), new ObjectMapper(), b);
        String token = signer.signToken("user123", "test@example.com");
        assertNull(verifier.verifyToken(token));
    }

    private void assertTrue(boolean condition) {
        if (!condition) {
            throw new AssertionError("Expected condition to be true");
        }
    }
}
