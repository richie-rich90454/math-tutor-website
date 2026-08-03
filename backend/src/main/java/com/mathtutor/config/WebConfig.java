package com.mathtutor.config;

import com.mathtutor.web.RequestSecurity;
import jakarta.servlet.Filter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.filter.HiddenHttpMethodFilter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Set;

@Configuration
@EnableScheduling
public class WebConfig implements WebMvcConfigurer {

    private final AppProperties props;

    public WebConfig(AppProperties props) {
        this.props = props;
    }

    // Legacy IE6 clients cannot send PATCH/DELETE over XHR; they POST with
    // ?_method=... which this filter translates back to the real HTTP method.
    @Bean
    public HiddenHttpMethodFilter hiddenHttpMethodFilter() {
        return new HiddenHttpMethodFilter();
    }

    // Security headers on every backend response (API + /legacy static files)
    // and a CSRF defense-in-depth Origin check on state-changing requests.
    @Bean
    public Filter securityHeadersFilter() {
        return (request, response, chain) -> {
            HttpServletResponse resp = (HttpServletResponse) response;
            resp.setHeader("X-Content-Type-Options", "nosniff");
            resp.setHeader("X-Frame-Options", "DENY");
            resp.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
            resp.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
            resp.setHeader("Content-Security-Policy",
                    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
                            + "img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; "
                            + "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");

            HttpServletRequest req = (HttpServletRequest) request;
            if (isMutating(req.getMethod())
                    && !RequestSecurity.isAllowedOrigin(req, props.cors().allowedOrigins())) {
                resp.setStatus(403);
                resp.setContentType("application/json");
                resp.getWriter().write("{\"error\":\"Origin not allowed\"}");
                return;
            }
            chain.doFilter(request, response);
        };
    }

    private static boolean isMutating(String method) {
        return method != null && Set.of("POST", "PUT", "PATCH", "DELETE").contains(method.toUpperCase());
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = props.cors().allowedOrigins().toArray(String[]::new);
        registry.addMapping("/api/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("X-Chat-Id", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/legacy").setViewName("forward:/legacy/index.html");
        registry.addViewController("/legacy/").setViewName("forward:/legacy/index.html");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String legacyDir = props.legacy().staticDir();
        registry.addResourceHandler("/legacy/**")
                .addResourceLocations("file:" + legacyDir + "/");
    }
}
