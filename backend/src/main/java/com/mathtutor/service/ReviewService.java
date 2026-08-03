package com.mathtutor.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class ReviewService {

    private static final double EASE_FACTOR = 2.5;
    private static final double EASE_STEP = 0.15;
    private static final int MAX_INTERVAL_DAYS = 30;

    private final JdbcTemplate jdbc;

    public ReviewService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record ReviewItem(
            String problemId,
            double ease,
            int intervalDays,
            String nextReview,
            String lastReview,
            int repetitions) {
    }

    // B9: right -> interval grows by ease (capped), ease creeps up; wrong ->
    // interval resets to 1 day and ease drops toward the floor. Zero AI tokens.
    public ReviewItem recordAnswer(String userId, String problemId, boolean correct) {
        ReviewItem existing = find(userId, problemId);
        double ease = existing == null ? EASE_FACTOR : existing.ease();
        int interval = existing == null ? 0 : existing.intervalDays();
        int repetitions = existing == null ? 0 : existing.repetitions();

        if (correct) {
            ease = Math.min(3.0, ease + EASE_STEP);
            interval = existing == null ? 1 : Math.min(MAX_INTERVAL_DAYS, (int) Math.ceil(interval * ease));
            repetitions = repetitions + 1;
        } else {
            ease = Math.max(1.3, ease - EASE_STEP);
            interval = 1;
            repetitions = 0;
        }

        String today = LocalDate.now().toString();
        String nextReview = LocalDate.now().plusDays(interval).toString();
        if (existing == null) {
            jdbc.update(
                    "INSERT INTO review_items (id, user_id, problem_id, ease, interval_days, next_review, last_review, repetitions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    UUID.randomUUID().toString(), userId, problemId, ease, interval, nextReview, today, repetitions);
        } else {
            jdbc.update(
                    "UPDATE review_items SET ease = ?, interval_days = ?, next_review = ?, last_review = ?, repetitions = ? WHERE user_id = ? AND problem_id = ?",
                    ease, interval, nextReview, today, repetitions, userId, problemId);
        }
        return new ReviewItem(problemId, ease, interval, nextReview, today, repetitions);
    }

    public List<ReviewItem> due(String userId, LocalDate date) {
        String cutoff = date == null ? LocalDate.now().toString() : date.toString();
        return jdbc.query(
                "SELECT problem_id, ease, interval_days, next_review, last_review, repetitions FROM review_items WHERE user_id = ? AND next_review <= ? ORDER BY next_review ASC",
                (rs, rowNum) -> mapItem(rs),
                userId, cutoff);
    }

    private ReviewItem find(String userId, String problemId) {
        return jdbc.query(
                "SELECT problem_id, ease, interval_days, next_review, last_review, repetitions FROM review_items WHERE user_id = ? AND problem_id = ?",
                rs -> rs.next() ? mapItem(rs) : null,
                userId, problemId);
    }

    private ReviewItem mapItem(ResultSet rs) throws SQLException {
        return new ReviewItem(
                rs.getString("problem_id"),
                rs.getDouble("ease"),
                rs.getInt("interval_days"),
                rs.getString("next_review"),
                rs.getString("last_review"),
                rs.getInt("repetitions"));
    }
}
