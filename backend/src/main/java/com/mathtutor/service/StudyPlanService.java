package com.mathtutor.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * D20 study plan: one AI call builds a 7-day plan (day, topic, practice problem
 * ids from the bank). Stored per user; each day is executed through practice mode.
 */
@Service
public class StudyPlanService {

    private final JdbcTemplate jdbc;
    private final AiClient aiClient;
    private final ProblemBank problemBank;

    public StudyPlanService(JdbcTemplate jdbc, AiClient aiClient, ProblemBank problemBank) {
        this.jdbc = jdbc;
        this.aiClient = aiClient;
        this.problemBank = problemBank;
    }

    public Optional<String> get(String userId) {
        return jdbc.query(
                "SELECT plan FROM study_plans WHERE user_id = ?",
                rs -> rs.next() ? Optional.of(rs.getString("plan")) : Optional.empty(),
                userId);
    }

    public String generate(String userId, String language) throws java.io.IOException {
        String lang = language == null || language.isBlank() ? "English" : language;
        Map<String, List<String>> byTopic = new LinkedHashMap<>();
        for (ProblemBank.Problem p : problemBank.list(null, "en", null, 400)) {
            byTopic.computeIfAbsent(p.topic(), k -> new ArrayList<>()).add(p.id());
        }
        StringBuilder available = new StringBuilder();
        for (Map.Entry<String, List<String>> entry : byTopic.entrySet()) {
            available.append(entry.getKey()).append(": [");
            for (int i = 0; i < entry.getValue().size() && i < 8; i++) {
                if (i > 0) {
                    available.append(", ");
                }
                available.append(entry.getValue().get(i));
            }
            available.append("]; ");
        }
        String prompt = "Create a 7-day math study plan. Each line must be: Day N | topic | "
                + "problemId1, problemId2. Use ONLY problem ids from the list below, progressing "
                + "from easy to harder topics. Reply in " + lang + ". Available problems: " + available;
        List<ContextBuilder.ContextMessage> context = new ArrayList<>();
        context.add(new ContextBuilder.ContextMessage("system", prompt));
        String plan = aiClient.complete(context, 800).trim();
        if (!plan.isEmpty()) {
            jdbc.update("""
                    INSERT INTO study_plans (user_id, plan, created_at) VALUES (?, ?, datetime('now'))
                    ON CONFLICT(user_id) DO UPDATE SET plan = excluded.plan, created_at = datetime('now')
                    """, userId, plan);
        }
        return plan;
    }
}
