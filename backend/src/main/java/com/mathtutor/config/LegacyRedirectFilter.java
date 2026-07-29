package com.mathtutor.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class LegacyRedirectFilter implements Filter {

    private static final String[] STATIC_PREFIXES = {"/assets/", "/legacy/", "/api/"};

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;
        String path = req.getRequestURI();

        for (String prefix : STATIC_PREFIXES) {
            if (path.startsWith(prefix)) {
                chain.doFilter(request, response);
                return;
            }
        }

        String userAgent = req.getHeader("User-Agent");
        if (userAgent != null && isLegacyBrowser(userAgent)) {
            resp.sendRedirect("/legacy/");
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean isLegacyBrowser(String ua) {
        return ua.contains("MSIE")
                && !ua.contains("Trident/7.0")
                && !ua.contains("MSIE 11");
    }
}
