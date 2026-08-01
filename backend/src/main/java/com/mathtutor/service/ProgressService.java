package com.mathtutor.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class ProgressService {

    private final JdbcTemplate jdbc;

    public ProgressService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Object> getProgress(String userId) {
        Map<String, Object> result = new HashMap<>();

        Long totalChats = jdbc.queryForObject(
                "SELECT COUNT(*) FROM chat_sessions WHERE user_id = ?",
                Long.class, userId);

        Long totalMessages = jdbc.queryForObject(
                """
                        SELECT COUNT(*) FROM chat_messages cm
                        JOIN chat_sessions cs ON cm.chat_session_id = cs.id
                        WHERE cs.user_id = ?
                        """,
                Long.class, userId);

        List<Map<String, Object>> topics = jdbc.queryForList(
                """
                        SELECT topic, COUNT(*) as count
                        FROM chat_sessions
                        WHERE user_id = ? AND topic IS NOT NULL AND topic != ''
                        GROUP BY topic
                        ORDER BY count DESC
                        """,
                userId);

        List<Map<String, Object>> recentChats = jdbc.queryForList(
                """
                        SELECT id, title, topic, created_at
                        FROM chat_sessions
                        WHERE user_id = ?
                        ORDER BY updated_at DESC
                        LIMIT 10
                        """,
                userId);

        List<Map<String, Object>> dailyActivity = jdbc.queryForList(
                """
                        SELECT DATE(created_at) as date, COUNT(*) as count
                        FROM chat_sessions
                        WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
                        GROUP BY DATE(created_at)
                        ORDER BY date DESC
                        """,
                userId);

        String memberSince = jdbc.queryForObject(
                "SELECT created_at FROM chat_sessions WHERE user_id = ? ORDER BY created_at ASC LIMIT 1",
                String.class, userId);

        int longestStreak = calculateStreak(dailyActivity);

        result.put("totalChats", totalChats == null ? 0 : totalChats);
        result.put("totalMessages", totalMessages == null ? 0 : totalMessages);
        result.put("topics", topics);
        result.put("recentChats", recentChats);
        result.put("dailyActivity", dailyActivity);
        result.put("memberSince", memberSince);
        result.put("longestStreak", longestStreak);
        return result;
    }

    private int calculateStreak(List<Map<String, Object>> dailyActivity) {
        if (dailyActivity == null || dailyActivity.isEmpty()) {
            return 0;
        }

        Set<String> dates = new java.util.HashSet<>();
        for (Map<String, Object> row : dailyActivity) {
            dates.add(String.valueOf(row.get("date")));
        }

        int streak = 0;
        LocalDate today = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE;

        for (int i = 0; i < 365; i++) {
            LocalDate d = today.minusDays(i);
            String dateStr = d.format(formatter);
            if (dates.contains(dateStr)) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        return streak;
    }
}
