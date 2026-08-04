package com.mathtutor.repo;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AnswerCacheRepositoryTest {

    private AnswerCacheRepository repo;

    @BeforeEach
    void setUp() {
        SingleConnectionDataSource ds = new SingleConnectionDataSource(
                "jdbc:sqlite::memory:", "", "", false);
        JdbcTemplate jdbc = new JdbcTemplate(ds);
        jdbc.execute("""
                CREATE TABLE answer_cache (
                    id TEXT PRIMARY KEY,
                    cache_key TEXT UNIQUE NOT NULL,
                    question TEXT NOT NULL,
                    language TEXT NOT NULL,
                    topic TEXT,
                    answer TEXT NOT NULL,
                    hit_count INTEGER DEFAULT 1,
                    chat_id TEXT,
                    user_id TEXT,
                    created_at TEXT DEFAULT (datetime('now'))
                )
                """);
        repo = new AnswerCacheRepository(jdbc);
    }

    @Test
    void findRecentInChatsMatchesChatIds() {
        repo.put("k1", "What is a limit?", "en", null, "A limit describes behavior near a point.", "c1", "u1");
        repo.put("k2", "What is a derivative?", "en", null, "A derivative measures instantaneous rate of change.", "c2", "u1");
        repo.put("k3", "What is an integral?", "en", null, "An integral accumulates a quantity over an interval.", "c9", "u1");
        List<AnswerCacheRepository.CacheRecord> rows = repo.findRecentInChats(List.of("c1", "c2"), 10);
        assertEquals(2, rows.size());
    }

    @Test
    void findRecentInChatsRespectsLimit() {
        for (int i = 0; i < 5; i++) {
            repo.put("key" + i, "Question " + i, "en", null, "An answer long enough to pass the cache threshold.", "c1", "u1");
        }
        List<AnswerCacheRepository.CacheRecord> rows = repo.findRecentInChats(List.of("c1"), 2);
        assertEquals(2, rows.size());
    }

    @Test
    void findRecentInChatsWithEmptyScope() {
        assertEquals(List.of(), repo.findRecentInChats(List.of(), 10));
    }
}
