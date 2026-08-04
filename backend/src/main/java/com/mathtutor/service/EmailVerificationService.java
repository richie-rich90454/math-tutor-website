package com.mathtutor.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;

/**
 * Email verification stub — written now, NOT wired into signup, no UI, no config
 * required. When SMTP is ready, follow docs/plans/GUIDE_WIRE_UP_SMTP.md.
 * ponytail: send() only logs until a mail client dependency and app.smtp config
 * exist; wire-up is deliberately deferred so nothing breaks today.
 */
@Service
public class EmailVerificationService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final org.slf4j.Logger LOG =
            org.slf4j.LoggerFactory.getLogger(EmailVerificationService.class);

    public String generateCode(int length) {
        int digits = Math.max(4, length);
        StringBuilder sb = new StringBuilder(digits);
        for (int i = 0; i < digits; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }

    public void sendVerificationCode(String email, String code) {
        LOG.info("SMTP not configured — verification code for {} would be: {}", email, code);
    }
}
