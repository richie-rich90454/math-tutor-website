package com.mathtutor.service;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AnswerCacheTest {

    @Test
    void normalizesWhitespaceCaseAndPunctuation() {
        assertEquals("what is 2 2", new AnswerCache(null, null).normalize("What  is 2+2???"));
    }

    @Test
    void shouldCacheAcceptsConceptQuestions() {
        AnswerCache cache = new AnswerCache(null, null);
        assertTrue(cache.shouldCache(
                "What is the Pythagorean theorem?",
                "The Pythagorean theorem states that in a right triangle, a squared plus b squared equals c squared."));
    }

    @Test
    void shouldCacheRejectsTrivialQuestions() {
        AnswerCache cache = new AnswerCache(null, null);
        assertFalse(cache.shouldCache("2+2", "4"));
        assertFalse(cache.shouldCache("hi", "Hello!"));
    }

    @Test
    void shouldCacheRejectsSpecificComputations() {
        AnswerCache cache = new AnswerCache(null, null);
        assertFalse(cache.shouldCache(
                "Solve 3x + 7 = 22 for x",
                "Subtract 7 from both sides to get 3x = 15, then divide by 3 to find x = 5."));
        assertFalse(cache.shouldCache(
                "My fish tank is 2.5m by 1.2m by 0.8m, what is the volume?",
                "Multiply 2.5 by 1.2 by 0.8 to get 2.4 cubic metres."));
    }

    @Test
    void shouldCacheRejectsTooShortAnswers() {
        AnswerCache cache = new AnswerCache(null, null);
        assertFalse(cache.shouldCache("What is the answer to life?", "42."));
    }

    @Test
    void jaccardReturnsOneForIdenticalBigrams() {
        assertEquals(1.0, AnswerCache.jaccard(
                AnswerCache.bigrams("solvesquareequation"),
                AnswerCache.bigrams("solvesquareequation")));
    }

    @Test
    void jaccardSeparatesDistinctQuestions() {
        double score = AnswerCache.jaccard(
                AnswerCache.bigrams("areaoftriangle"),
                AnswerCache.bigrams("derivativeofsinx"));
        assertFalse(score >= 0.85, "distinct questions must not fuzzy-match, got " + score);
    }

    @Test
    void jaccardMatchesNearIdenticalQuestions() {
        double score = AnswerCache.jaccard(
                AnswerCache.bigrams("whatistheareaoftrianglewithbase4height3"),
                AnswerCache.bigrams("whatistheareaoftrianglewithbase4andheight3"));
        assertTrue(score >= 0.85, "near-identical questions should match, got " + score);
    }

    @Test
    void jaccardMatchesEmptyBigrams() {
        Set<String> empty = AnswerCache.bigrams("");
        assertEquals(1.0, AnswerCache.jaccard(empty, empty));
    }
}
