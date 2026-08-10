package com.mathtutor.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

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

    // The 14 minority packs + Traditional Chinese route to the zh-hans problems.
    @ParameterizedTest
    @ValueSource(strings = {"zh-hant", "bca", "dng", "hni", "iom", "lic", "lhu", "lis",
            "nxq", "pcc", "tdd", "tji", "wbm", "yi", "za"})
    void minorityPacksAliasToZhHans(String lang) {
        List<ProblemBank.Problem> problems = bank.list("algebra", lang, null, null);
        assertFalse(problems.isEmpty());
        assertTrue(problems.get(0).language().equals("zh-hans"),
                lang + " should serve zh-hans problems");
    }

    // problemOfDay must never throw, even for degenerate inputs.
    @ParameterizedTest
    @ValueSource(strings = {"en", "zh-hans", "mn-cyrl", "yi", "es", "fr", "bo", "ug",
            "zz", "", "ALGEBRA"})
    void problemOfDayNeverThrows(String lang) {
        Optional<ProblemBank.Problem> pick = bank.problemOfDay(null, lang);
        assertNotNull(pick);
        if (pick.isPresent()) {
            assertNotNull(pick.get().question());
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"arithmetic", "algebra", "geometry", "calculus", "trigonometry", "statistics"})
    void problemOfDayServesEachTopic(String topic) {
        Optional<ProblemBank.Problem> pick = bank.problemOfDay(topic, "en");
        assertTrue(pick.isPresent());
        assertEquals(topic, pick.get().topic());
    }

    @Test
    void problemOfDayWithNullTopicAndNullLanguageWorks() {
        assertNotNull(bank.problemOfDay(null, null));
    }

    @Test
    void problemOfDayForUnknownTopicIsEmpty() {
        assertTrue(bank.problemOfDay("not-a-topic", "en").isEmpty());
    }

    @Test
    void listFiltersByGrade() {
        int grade = bank.list("arithmetic", "en", null, null).get(0).grade();
        List<ProblemBank.Problem> filtered = bank.list("arithmetic", "en", grade, null);
        assertFalse(filtered.isEmpty());
        for (ProblemBank.Problem p : filtered) {
            assertEquals(grade, p.grade());
        }
    }

    @Test
    void listLimitsResults() {
        List<ProblemBank.Problem> limited = bank.list("arithmetic", "en", null, 5);
        assertTrue(limited.size() <= 5);
    }

    @Test
    void listWithNullGradeReturnsAll() {
        assertFalse(bank.list("algebra", "en", null, null).isEmpty());
    }

    @Test
    void allProblemsHaveAnswerIndexInRange() {
        for (ProblemBank.Problem p : bank.list("statistics", "en", null, null)) {
            assertTrue(p.answerIndex() >= 0 && p.answerIndex() < p.options().size());
        }
    }

    @Test
    void allProblemsHaveFourOptions() {
        for (String topic : List.of("arithmetic", "algebra", "geometry", "calculus", "trigonometry", "statistics")) {
            for (ProblemBank.Problem p : bank.list(topic, "en", null, null)) {
                assertEquals(4, p.options().size());
            }
        }
    }

    @Test
    void zhHansProblemsShareIdsPattern() {
        for (ProblemBank.Problem p : bank.list("algebra", "zh-hans", null, null)) {
            assertTrue(p.id().endsWith("-zh-hans"));
        }
    }

    @Test
    void mnCyrlProblemsAreDistinctFromEnglish() {
        List<ProblemBank.Problem> mn = bank.list("arithmetic", "mn-cyrl", null, null);
        List<ProblemBank.Problem> en = bank.list("arithmetic", "en", null, null);
        assertFalse(mn.isEmpty());
        assertFalse(en.isEmpty());
        assertFalse(mn.get(0).question().equals(en.get(0).question()));
    }
}
