package com.mathtutor.service;

import org.springframework.stereotype.Service;

import java.util.concurrent.Semaphore;

/**
 * Caps the number of simultaneous upstream AI stream calls so a burst of users
 * cannot spike provider cost or pile requests onto the model. Excess calls get
 * a clean 503 instead of running the bill up.
 */
@Service
public class StreamLimiter {

    private static final int MAX_CONCURRENT = 8;
    private final Semaphore permits = new Semaphore(MAX_CONCURRENT);

    public boolean tryAcquire() {
        return permits.tryAcquire();
    }

    public void release() {
        permits.release();
    }
}
