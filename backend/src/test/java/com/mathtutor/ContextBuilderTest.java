package com.mathtutor;

import com.mathtutor.service.ContextBuilder;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ContextBuilderTest {

    private final ContextBuilder builder = new ContextBuilder();

    @Test
    void prependsSystemMessageAndWrapsUserContent() {
        var context = builder.buildContext("system prompt", List.of(), "hello");
        assertEquals(3, context.size());
        assertEquals("system", context.get(0).role());
        assertEquals("system prompt", context.get(0).content());
        assertEquals("user", context.get(1).role());
        assertTrue(context.get(1).content().startsWith("[USER CONTENT START]\nhello\n[USER CONTENT END]"));
        assertTrue(context.get(2).content().startsWith("[SYSTEM INSTRUCTION]"));
    }

    @Test
    void includesHistoryBeforeNewMessage() {
        List<ContextBuilder.ContextMessage> history = List.of(
                new ContextBuilder.ContextMessage("user", "q1"),
                new ContextBuilder.ContextMessage("assistant", "a1"));
        var context = builder.buildContext("sys", history, "q2");
        assertEquals(5, context.size());
        assertTrue(context.get(1).content().startsWith("[USER CONTENT START]\nq1\n[USER CONTENT END]"));
        assertEquals("a1", context.get(2).content());
        assertTrue(context.get(3).content().startsWith("[USER CONTENT START]\nq2\n[USER CONTENT END]"));
    }

    @Test
    void keepsHistoryBelowCompactionThresholdInFull() {
        List<ContextBuilder.ContextMessage> history = new ArrayList<>();
        for (int i = 0; i < ContextBuilder.MAX_CONTEXT_MESSAGES; i++) {
            history.add(new ContextBuilder.ContextMessage(
                    i % 2 == 0 ? "user" : "assistant",
                    "msg-" + i));
        }
        var context = builder.buildContext("sys", history, "final");
        assertEquals(ContextBuilder.MAX_CONTEXT_MESSAGES + 3, context.size());
        assertTrue(context.get(1).content().contains("msg-0"));
    }

    @Test
    void appendsTailBlocksAfterNewMessage() {
        var context = builder.buildContext(
                "sys", List.of(), "q", List.of("culture: herding, milk tea"));
        assertEquals(4, context.size());
        assertTrue(context.get(1).content().startsWith("[USER CONTENT START]\nq\n[USER CONTENT END]"));
        assertEquals("culture: herding, milk tea", context.get(2).content());
        assertTrue(context.get(3).content().startsWith("[SYSTEM INSTRUCTION]"));
    }

    @Test
    void prefixIsStableAcrossDifferentMessages() {
        var a = builder.buildContext("SYSTEM", List.of(), "q1", List.of("tail"));
        var b = builder.buildContext("SYSTEM", List.of(), "q2", List.of("tail"));
        assertEquals(a.get(0).content(), b.get(0).content());
        assertEquals("SYSTEM", a.get(0).content());
    }

    @Test
    void compactsLongHistoryToAnchorPlusRecentTail() {
        List<ContextBuilder.ContextMessage> history = new ArrayList<>();
        history.add(new ContextBuilder.ContextMessage("user", "first-question"));
        for (int i = 1; i < 50; i++) {
            history.add(new ContextBuilder.ContextMessage(
                    i % 2 == 0 ? "user" : "assistant",
                    "msg-" + i));
        }
        var context = builder.buildContext("sys", history, "final");
        // system + anchor + 4 tail + wrapped newMessage + guard
        assertEquals(8, context.size());
        assertTrue(context.get(1).content().contains("first-question"));
        assertTrue(context.get(2).content().contains("msg-46"));
        assertTrue(context.get(5).content().contains("msg-49"));
        assertTrue(context.get(6).content().startsWith("[USER CONTENT START]\nfinal\n[USER CONTENT END]"));
    }
}
