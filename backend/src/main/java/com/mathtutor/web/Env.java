package com.mathtutor.web;

public final class Env {

    private Env() {
    }

    public static boolean isProduction() {
        String profile = System.getenv("SPRING_PROFILES_ACTIVE");
        String env = System.getenv("NODE_ENV");
        return "prod".equals(profile)
                || "production".equals(profile)
                || "production".equals(env);
    }
}
