package com.mathtutor.controller;

import com.mathtutor.service.SheetsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sheets")
public class SheetsController {

    private final SheetsService sheets;

    public SheetsController(SheetsService sheets) {
        this.sheets = sheets;
    }

    @GetMapping
    public ResponseEntity<?> sheets(@RequestParam(required = false) String topic) {
        if (topic == null || topic.isBlank()) {
            List<Map<String, Object>> out = new ArrayList<>();
            for (SheetsService.SheetTopic sheet : sheets.all()) {
                out.add(sheets.toJson(sheet));
            }
            return ResponseEntity.ok(Map.of("sheets", out));
        }
        SheetsService.SheetTopic sheet = sheets.get(topic).orElse(null);
        if (sheet == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Topic not found"));
        }
        return ResponseEntity.ok(Map.of("sheet", sheets.toJson(sheet)));
    }
}
