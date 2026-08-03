package com.mathtutor.service;

import com.mathtutor.config.AppProperties;
import com.mathtutor.repo.UsageRepository;
import org.springframework.stereotype.Service;

/**
 * Per-user token quota. Soft (80% used) -> warning header + client banner;
 * hard (100%) -> the controller returns 429 with Retry-After until reset.
 * Monthly quota is optional; 0 disables it (see app.quota.monthly-tokens).
 */
@Service
public class QuotaService {

    private final AppProperties props;
    private final UsageRepository usage;

    public QuotaService(AppProperties props, UsageRepository usage) {
        this.props = props;
        this.usage = usage;
    }

    public record QuotaResult(
            long used,
            long limit,
            long remaining,
            boolean softWarn,
            boolean hardExceeded) {
    }

    public QuotaResult check(String userId, String ip, boolean guest) {
        AppProperties.Quota cfg = props.quota();
        // D21: guest sessions are quota-keyed on the client IP so creating new
        // guest accounts can't be used to bypass the daily token cap.
        long used = guest && ip != null && !ip.isBlank()
                ? usage.sumByIpSince(ip, "datetime('now', '-1 day')").total()
                : usage.sumByTypeSince(userId, "datetime('now', '-1 day')").total();
        long limit = cfg.dailyTokens() <= 0 ? Long.MAX_VALUE : cfg.dailyTokens();
        long remaining = Math.max(0, limit - used);
        double softRatio = cfg.softRatio() <= 0 ? 0.80 : cfg.softRatio();
        boolean softWarn = limit != Long.MAX_VALUE && used >= limit * softRatio && used < limit;
        boolean hardExceeded = used >= limit;
        return new QuotaResult(used, limit == Long.MAX_VALUE ? 0 : limit, remaining, softWarn, hardExceeded);
    }

    public void setHeaders(jakarta.servlet.http.HttpServletResponse response, QuotaResult result) {
        response.setHeader("X-Quota-Limit", String.valueOf(result.limit()));
        response.setHeader("X-Quota-Used", String.valueOf(result.used()));
        response.setHeader("X-Quota-Remaining", String.valueOf(result.remaining()));
        response.setHeader("X-Quota-Warning", String.valueOf(result.softWarn()));
    }
}
