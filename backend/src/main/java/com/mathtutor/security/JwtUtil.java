package com.mathtutor.security;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.mathtutor.config.AppProperties;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
public class JwtUtil {

    private static final long JWT_EXPIRES_IN_SECONDS = 7L * 24 * 60 * 60;

    private final SecurityUtil security;
    private final ObjectMapper objectMapper;
    private final AppProperties props;

    public JwtUtil(SecurityUtil security, ObjectMapper objectMapper, AppProperties props) {
        this.security = security;
        this.objectMapper = objectMapper;
        this.props = props;
    }

    private String getSecret() {
        String secret = props.auth().sessionSecret();
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "SESSION_SECRET environment variable is required. Set it to a long random string.");
        }
        return secret;
    }

    public String signToken(String sub, String email) {
        String secret = getSecret();
        String header = security.base64UrlEncode(
                "{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        long now = System.currentTimeMillis() / 1000;
        String bodyJson;
        try {
            bodyJson = objectMapper.writeValueAsString(java.util.Map.of(
                    "sub", sub,
                    "email", email == null ? "" : email,
                    "iat", now,
                    "exp", now + JWT_EXPIRES_IN_SECONDS));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to build JWT body", e);
        }
        String body = security.base64UrlEncode(bodyJson.getBytes(StandardCharsets.UTF_8));
        String signature = security.hmacSha256(header + "." + body, secret);
        return header + "." + body + "." + signature;
    }

    public JsonNode verifyToken(String token) {
        try {
            String secret = getSecret();
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return null;
            }
            String header = parts[0];
            String body = parts[1];
            String signature = parts[2];

            String expected = security.hmacSha256(header + "." + body, secret);
            if (!constantTimeEquals(signature, expected)) {
                return null;
            }

            byte[] bodyBytes = Base64.getUrlDecoder().decode(body);
            JsonNode payload = objectMapper.readTree(bodyBytes);

            if (payload.has("exp") && payload.get("exp").asLong() < System.currentTimeMillis() / 1000) {
                return null;
            }
            return payload;
        } catch (Exception e) {
            return null;
        }
    }

    private boolean constantTimeEquals(String a, String b) {
        byte[] aBytes = a.getBytes(StandardCharsets.UTF_8);
        byte[] bBytes = b.getBytes(StandardCharsets.UTF_8);
        if (aBytes.length != bBytes.length) {
            return false;
        }
        return java.security.MessageDigest.isEqual(aBytes, bBytes);
    }
}
