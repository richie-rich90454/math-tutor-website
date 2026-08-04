package com.mathtutor;

import com.mathtutor.security.SecurityUtil;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SecurityUtilTest {

    private final SecurityUtil security = new SecurityUtil();

    @Test
    void hashPasswordReturnsFourPartFormat() {
        String hash = security.hashPassword("testpassword");
        String[] parts = hash.split(":");
        assertEquals(4, parts.length);
    }

    @Test
    void hashPasswordProducesDifferentHashes() {
        String hash1 = security.hashPassword("password1");
        String hash2 = security.hashPassword("password2");
        assertFalse(hash1.equals(hash2));
    }

    @Test
    void comparePasswordMatchesCorrectPassword() {
        String hash = security.hashPassword("mypassword");
        assertTrue(security.comparePassword("mypassword", hash));
    }

    @Test
    void comparePasswordRejectsWrongPassword() {
        String hash = security.hashPassword("mypassword");
        assertFalse(security.comparePassword("wrongpassword", hash));
    }

    @Test
    void comparePasswordHandlesLegacyTwoPartFormat() {
        String salt = "abc123";
        String hash = sha256Hex("test" + salt);
        String stored = salt + ":" + hash;
        assertTrue(security.comparePassword("test", stored));
        assertFalse(security.comparePassword("wrong", stored));
    }

    @Test
    void comparePasswordRejectsMalformedStoredHash() {
        assertFalse(security.comparePassword("test", "invalid"));
        assertFalse(security.comparePassword("test", "a:b:c"));
    }

    private String sha256Hex(String input) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
