package com.mathtutor.service;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProblemBankTest {

    private final ProblemBank bank = new ProblemBank();

    @Test
    void loadsArithmeticProblemsForEnglish() {
        assertEquals(12, bank.list("arithmetic", "en", null, null).size());
    }

    @Test
    void fallsBackToEnglishForUnknownLanguage() {
        assertEquals(12, bank.list("algebra", "xx-unknown", null, null).size());
    }

    @Test
    void findsProblemById() {
        Optional<ProblemBank.Problem> problem = bank.findById("arith-001-en");
        assertTrue(problem.isPresent());
        assertEquals("arithmetic", problem.get().topic());
        assertEquals(4, problem.get().options().size());
    }

    @Test
    void problemOfDayIsDeterministicWithinSameDay() {
        Optional<ProblemBank.Problem> a = bank.problemOfDay("algebra", "zh-hans");
        Optional<ProblemBank.Problem> b = bank.problemOfDay("algebra", "zh-hans");
        assertTrue(a.isPresent());
        assertEquals(a.get().id(), b.get().id());
    }

    @Test
    void identicalProblemsAcrossLanguagesShareIndex() {
        Optional<ProblemBank.Problem> en = bank.findById("stat-003-en");
        Optional<ProblemBank.Problem> zh = bank.findById("stat-003-zh-hans");
        assertTrue(en.isPresent());
        assertTrue(zh.isPresent());
        assertNotNull(en.get().question());
        assertNotNull(zh.get().question());
        assertFalse(en.get().question().equals(zh.get().question()));
    }

    @Test
    void loadsAllSixTopics() {
        List<String> topics = List.of("arithmetic", "algebra", "geometry", "calculus", "trigonometry", "statistics");
        for (String topic : topics) {
            assertFalse(bank.list(topic, "en", null, null).isEmpty(), "topic should have problems: " + topic);
        }
    }
}
