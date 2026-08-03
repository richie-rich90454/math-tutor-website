package com.mathtutor.service;

import com.mathtutor.repo.MessageRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * D18 study notes: one compact AI call compresses a chat into bullet notes
 * (<=150 tokens). The note is stored per chat and later reused as context by
 * the chat service (compounds A4 compaction).
 */
@Service
public class NotesService {

    private final JdbcTemplate jdbc;
    private final MessageRepository messages;
    private final AiClient aiClient;
    private final ContextBuilder contextBuilder;

    public NotesService(JdbcTemplate jdbc, MessageRepository messages, AiClient aiClient, ContextBuilder contextBuilder) {
        this.jdbc = jdbc;
        this.messages = messages;
        this.aiClient = aiClient;
        this.contextBuilder = contextBuilder;
    }

    public Optional<String> get(String chatId) {
        return jdbc.query(
                "SELECT note FROM chat_notes WHERE chat_session_id = ?",
                rs -> rs.next() ? Optional.of(rs.getString("note")) : Optional.empty(),
                chatId);
    }

    public String generate(String chatId, String language) throws java.io.IOException {
        List<MessageRepository.MessageRecord> history = messages.findRecent(chatId, ContextBuilder.MAX_HISTORY_FETCH);
        List<ContextBuilder.ContextMessage> contextMessages = new ArrayList<>();
        for (MessageRepository.MessageRecord msg : history) {
            contextMessages.add(new ContextBuilder.ContextMessage(msg.role(), msg.content()));
        }
        if (contextMessages.isEmpty()) {
            return "";
        }
        String langHint = language == null || language.isBlank() ? "English" : language;
        String prompt = "Compress this math tutoring chat into a study note: short bullet "
                + "points of the key concepts, formulas and steps covered. Keep it under 150 tokens. "
                + "Write the note in " + langHint + ".";
        List<ContextBuilder.ContextMessage> noteContext = new ArrayList<>();
        noteContext.add(new ContextBuilder.ContextMessage("system", prompt));
        noteContext.addAll(contextMessages.subList(
                Math.max(0, contextMessages.size() - 20), contextMessages.size()));
        String note = aiClient.complete(noteContext, 300).trim();
        if (!note.isEmpty()) {
            jdbc.update("""
                    INSERT INTO chat_notes (chat_session_id, note, updated_at) VALUES (?, ?, datetime('now'))
                    ON CONFLICT(chat_session_id) DO UPDATE SET note = excluded.note, updated_at = datetime('now')
                    """, chatId, note);
        }
        return note;
    }
}
