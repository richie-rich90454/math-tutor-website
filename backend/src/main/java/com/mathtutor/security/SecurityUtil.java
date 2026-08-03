package com.mathtutor.security;

import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.SecretKeyFactory;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.nio.charset.StandardCharsets;

@Component
public class SecurityUtil {

    private static final int PBKDF2_ITERATIONS = 100000;
    private static final int PBKDF2_KEYLEN = 32;
    private static final String PBKDF2_DIGEST = "SHA256";
    private final SecureRandom secureRandom = new SecureRandom();

    public String hashPassword(String password) {
        byte[] salt = new byte[16];
        secureRandom.nextBytes(salt);
        String saltHex = toHex(salt);
        String hashHex = pbkdf2(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN);
        return saltHex + ":" + PBKDF2_ITERATIONS + ":" + PBKDF2_KEYLEN + ":" + hashHex;
    }

    public boolean comparePassword(String password, String stored) {
        String[] parts = stored.split(":");
        if (parts.length == 2) {
            String salt = parts[0];
            String hash = parts[1];
            if (salt == null || salt.isEmpty() || hash == null || hash.isEmpty()) {
                return false;
            }
            String computed = sha256Hex(password + salt);
            return MessageDigest.isEqual(
                    toBytes(computed),
                    toBytes(hash));
        }
        if (parts.length == 4) {
            String salt = parts[0];
            int iterations;
            int keylen;
            try {
                iterations = Integer.parseInt(parts[1]);
                keylen = Integer.parseInt(parts[2]);
            } catch (NumberFormatException e) {
                return false;
            }
            String hash = parts[3];
            if (salt == null || salt.isEmpty() || iterations <= 0 || keylen <= 0 || hash == null || hash.isEmpty()) {
                return false;
            }
            String computed = pbkdf2(password, toBytes(salt), iterations, keylen);
            return MessageDigest.isEqual(
                    toBytes(computed),
                    toBytes(hash));
        }
        return false;
    }

    private String pbkdf2(String password, byte[] salt, int iterations, int keylen) {
        try {
            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, iterations, keylen * 8);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] hash = factory.generateSecret(spec).getEncoded();
            return toHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException("PBKDF2 hashing failed", e);
        }
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return toHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 hashing failed", e);
        }
    }

    private String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private byte[] toBytes(String hex) {
        int len = hex.length();
        byte[] bytes = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            bytes[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                    + Character.digit(hex.charAt(i + 1), 16));
        }
        return bytes;
    }

    public String base64UrlEncode(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }

    public String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(
                    secret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"));
            return base64UrlEncode(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC-SHA256 failed", e);
        }
    }
}
