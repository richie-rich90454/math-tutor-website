package com.mathtutor.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SheetsServiceTest {

    private final SheetsService sheets = new SheetsService();

    @Test
    void loadsAllSixTopics() {
        assertEquals(6, sheets.all().size());
    }

    @Test
    void eachTopicHasFormulasAndTerms() {
        for (SheetsService.SheetTopic topic : sheets.all()) {
            assertFalse(topic.formulas().isEmpty());
            assertFalse(topic.terms().isEmpty());
        }
    }

    @Test
    void getByUnknownTopicIsEmpty() {
        assertTrue(sheets.get("unknown-topic").isEmpty());
    }

    @Test
    void englishNamesRemainEnglish() {
        SheetsService.SheetTopic t = sheets.get("algebra").orElseThrow();
        assertEquals("Quadratic formula", t.formulas().get(1).name());
    }

    // The 18 authored languages must all return a localized, non-blank name for
    // a well-known entry, and it must differ from the English source.
    @ParameterizedTest
    @CsvSource({
            "es, fórmula cuadrática", "fr, formule quadratique", "de, Quadratische Formel",
            "ja, 二次方程式の解の公式", "ko, 근의 공식", "ru, формула корней квадратного уравнения",
            "ar, الصيغة التربيعية", "he, נוסחת השורשים", "vi, công thức nghiệm bậc hai",
            "uz, kvadrat formula", "ky, квадрат формула", "tg, формулаи квадратӣ",
            "kk, квадрат формула", "mn-cyrl, квадрат томъёо", "mn-mong, ᠬᠸᠠᠳᠷᠠᠲ᠋ ᠲᠣᠮᠤᠶ᠎ᠠ",
            "bo, ཐིག་གཉིས་ཀྱི་ཚད་གཞི།", "ug, كۋادرات فورمۇلا", "hmn, formula quadratic"
    })
    void localizesQuadraticFormulaName(String lang, String expected) {
        SheetsService.SheetTopic t = sheets.get("algebra", lang).orElseThrow();
        assertEquals(expected, t.formulas().get(1).name());
    }

    // Mandarin-based languages fall back to the mandarin field.
    @ParameterizedTest
    @ValueSource(strings = {"zh-hans", "zh-hant", "bca", "dng", "hni", "iom", "lic", "lhu",
            "lis", "nxq", "pcc", "tdd", "tji", "wbm", "yi", "za"})
    void mandarinBasedLanguagesUseMandarin(String lang) {
        SheetsService.SheetTopic t = sheets.get("algebra", lang).orElseThrow();
        String localized = t.formulas().get(1).name();
        String mandarin = t.formulas().get(1).mandarin();
        assertEquals(mandarin, localized);
    }

    @ParameterizedTest
    @ValueSource(strings = {"es", "fr", "de", "ja", "ko", "ru", "ar", "he", "vi", "uz",
            "ky", "tg", "kk", "mn-cyrl", "mn-mong", "bo", "ug", "hmn"})
    void authoredLanguagesDifferFromEnglish(String lang) {
        SheetsService.SheetTopic en = sheets.get("algebra").orElseThrow();
        SheetsService.SheetTopic localized = sheets.get("algebra", lang).orElseThrow();
        assertTrue(!localized.formulas().get(1).name().equals(en.formulas().get(1).name()));
    }

    @ParameterizedTest
    @ValueSource(strings = {"es", "fr", "de", "ja", "ko", "ru", "ar", "he", "vi", "uz",
            "ky", "tg", "kk", "mn-cyrl", "mn-mong", "bo", "ug", "hmn", "zh-hans", "yi", "za"})
    void everyLanguageReturnsNonBlankNames(String lang) {
        for (SheetsService.SheetTopic t : sheets.all(lang)) {
            for (SheetsService.Formula f : t.formulas()) {
                assertNotNull(f.name());
                assertFalse(f.name().isBlank());
            }
            for (SheetsService.Term term : t.terms()) {
                assertNotNull(term.term());
                assertFalse(term.term().isBlank());
            }
        }
    }

    @Test
    void nullLanguageReturnsEnglish() {
        SheetsService.SheetTopic t = sheets.get("algebra", null).orElseThrow();
        assertEquals("Quadratic formula", t.formulas().get(1).name());
    }

    @Test
    void unknownLanguageFallsBackToEnglish() {
        SheetsService.SheetTopic t = sheets.get("algebra", "xx-unknown").orElseThrow();
        assertEquals("Quadratic formula", t.formulas().get(1).name());
    }

    @Test
    void toJsonIncludesLocalizedName() {
        java.util.Map<String, Object> json = sheets.toJson(sheets.get("algebra", "es").orElseThrow());
        List<?> formulas = (List<?>) json.get("formulas");
        java.util.Map<?, ?> qf = (java.util.Map<?, ?>) formulas.get(1);
        assertEquals("fórmula cuadrática", qf.get("name"));
    }

    @Test
    void allWithLanguageLocalizesEveryTopic() {
        for (SheetsService.SheetTopic t : sheets.all("fr")) {
            for (SheetsService.Formula f : t.formulas()) {
                assertNotNull(f.name());
            }
        }
    }
}
