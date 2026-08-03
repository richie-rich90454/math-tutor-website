package com.mathtutor.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReviewServiceTest {

    private SingleConnectionDataSource dataSource;
    private JdbcTemplate jdbc;
    private ReviewService service;

    @BeforeEach
    void setUp() {
        dataSource = new SingleConnectionDataSource("jdbc:sqlite::memory:", true);
        jdbc = new JdbcTemplate(dataSource);
        jdbc.execute("""
                CREATE TABLE review_items (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    problem_id TEXT NOT NULL,
                    ease REAL DEFAULT 2.5,
                    interval_days INTEGER DEFAULT 1,
                    next_review TEXT NOT NULL,
                    last_review TEXT,
                    repetitions INTEGER DEFAULT 0,
                    UNIQUE(user_id, problem_id)
                )
                """);
        service = new ReviewService(jdbc);
    }

    @AfterEach
    void tearDown() {
        dataSource.destroy();
    }

    @Test
    void wrongAnswerResetsToOneDayInterval() {
        ReviewService.ReviewItem item = service.recordAnswer("u1", "p1", false);
        assertEquals(1, item.intervalDays());
        assertEquals(LocalDate.now().plusDays(1).toString(), item.nextReview());
        assertEquals(0, item.repetitions());
    }

    @Test
    void correctAnswerGrowsIntervalByEase() {
        service.recordAnswer("u1", "p1", false);
        ReviewService.ReviewItem correct = service.recordAnswer("u1", "p1", true);
        assertTrue(correct.intervalDays() > 1, "interval should grow after a correct answer");
        assertEquals(1, correct.repetitions());
    }

    @Test
    void intervalCapsAtThirtyDays() {
        for (int i = 0; i < 30; i++) {
            service.recordAnswer("u1", "p1", true);
        }
        ReviewService.ReviewItem item = service.recordAnswer("u1", "p1", true);
        assertTrue(item.intervalDays() <= 30, "interval must not exceed 30 days");
    }

    @Test
    void dueListsOnlyItemsScheduledAtOrBeforeDate() {
        service.recordAnswer("u1", "p1", false);
        service.recordAnswer("u1", "p2", true);
        service.recordAnswer("u1", "p2", true);
        // p1 wrong -> next review tomorrow; p2 correct twice -> interval grows to 3 days
        List<ReviewService.ReviewItem> dueToday = service.due("u1", LocalDate.now());
        assertEquals(0, dueToday.size(), "nothing answered today is due today");
        List<ReviewService.ReviewItem> dueTomorrow = service.due("u1", LocalDate.now().plusDays(1));
        assertTrue(dueTomorrow.stream().anyMatch(i -> i.problemId().equals("p1")));
        assertTrue(dueTomorrow.stream().noneMatch(i -> i.problemId().equals("p2")));
    }
}
