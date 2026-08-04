package com.mathtutor;

import com.mathtutor.service.TopicExtractor;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class TopicExtractorTest {

    private final TopicExtractor extractor = new TopicExtractor();

    @Test
    void detectsAlgebraTopic() {
        assertEquals("algebra", extractor.extractTopic("Solve this quadratic equation for x"));
    }

    @Test
    void detectsGeometryTopic() {
        assertEquals("geometry", extractor.extractTopic("What is the area of a triangle?"));
    }

    @Test
    void detectsCalculusTopic() {
        assertEquals("calculus", extractor.extractTopic("Find the derivative of x squared"));
    }

    @Test
    void detectsTrigonometryTopic() {
        assertEquals("trigonometry", extractor.extractTopic("What is the sine of 30 degrees?"));
    }

    @Test
    void detectsStatisticsTopic() {
        assertEquals("statistics", extractor.extractTopic("Explain probability distributions"));
    }

    @Test
    void detectsArithmeticTopic() {
        assertEquals("arithmetic", extractor.extractTopic("Help me practice fraction addition"));
    }

    @Test
    void returnsNullForUnknownTopic() {
        assertNull(extractor.extractTopic("What is your favorite color?"));
    }

    @Test
    void returnsNullForNullMessage() {
        assertNull(extractor.extractTopic(null));
    }

    @Test
    void detectsChineseKeywords() {
        assertEquals("algebra", extractor.extractTopic("帮我解方程式"));
    }
}
