package com.mathtutor.controller;

import com.mathtutor.service.CultureService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/culture")
public class CultureController {

    private final CultureService culture;

    public CultureController(CultureService culture) {
        this.culture = culture;
    }

    @GetMapping("/{language}")
    public ResponseEntity<?> culture(@PathVariable String language) {
        return culture.keywords(language)
                .map(kw -> ResponseEntity.ok(Map.of("language", language, "keywords", kw)))
                .orElseGet(() -> ResponseEntity.ok(Map.of("language", language, "keywords", java.util.List.of())));
    }
}
