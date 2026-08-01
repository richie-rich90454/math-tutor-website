package com.mathtutor;

import com.mathtutor.service.ContextBuilder;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ContextBuilderTest {

    private final ContextBuilder builder = new ContextBuilder();

    @Test
    void prependsSystemMessage() {
        var context = builder.buildContext("system prompt", List.of(), "hello");
        assertEquals(2, context.size());
        assertEquals("system", context.get(0).role());
        assertEquals("system prompt", context.get(0).content());
        assertEquals("user", context.get(1).role());
        assertEquals("hello", context.get(1).content());
    }

    @Test
    void includesHistoryBeforeNewMessage() {
        List<ContextBuilder.ContextMessage> history = List.of(
                new ContextBuilder.ContextMessage("user", "q1"),
                new ContextBuilder.ContextMessage("assistant", "a1"));
        var context = builder.buildContext("sys", history, "q2");
        assertEquals(4, context.size());
        assertEquals("q1", context.get(1).content());
        assertEquals("a1", context.get(2).content());
        assertEquals("q2", context.get(3).content());
    }

    @Test
    void truncatesHistoryToMaxContextMessages() {
        List<ContextBuilder.ContextMessage> history = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            history.add(new ContextBuilder.ContextMessage(
                    i % 2 == 0 ? "user" : "assistant",
                    "msg-" + i));
        }
        var context = builder.buildContext("sys", history, "final");
        assertEquals(ContextBuilder.MAX_CONTEXT_MESSAGES + 2, context.size());
        assertEquals("msg-30", context.get(1).content());
        assertEquals("final", context.get(context.size() - 1).content());
    }
}
