package com.mathtutor.service;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AnswerCacheTest {

    @Test
    void normalizesWhitespaceCaseAndPunctuation() {
        assertEquals("what is 2 2", new AnswerCache(null).normalize("What  is 2+2???"));
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
