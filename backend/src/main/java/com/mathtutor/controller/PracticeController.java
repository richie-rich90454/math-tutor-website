package com.mathtutor.controller;

import com.mathtutor.dto.JsonBody;
import com.mathtutor.dto.JsonLike;
import com.mathtutor.service.ProblemBank;
import com.mathtutor.service.ProgressService;
import com.mathtutor.service.ReviewService;
import com.mathtutor.service.SessionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class PracticeController {

    private static final String SESSION_COOKIE = "session_token";

    private final SessionService sessionService;
    private final ProblemBank problemBank;
    private final ReviewService reviewService;
    private final ProgressService progressService;

    public PracticeController(
            SessionService sessionService,
            ProblemBank problemBank,
            ReviewService reviewService,
            ProgressService progressService) {
        this.sessionService = sessionService;
        this.problemBank = problemBank;
        this.reviewService = reviewService;
        this.progressService = progressService;
    }

    @GetMapping("/problems")
    public ResponseEntity<?> problems(
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) Integer grade,
            @RequestParam(required = false) Integer limit) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (ProblemBank.Problem p : problemBank.list(topic, language, grade, limit)) {
            out.add(problemBank.toJson(p));
        }
        return ResponseEntity.ok(Map.of("problems", out));
    }

    @GetMapping("/problem-of-day")
    public ResponseEntity<?> problemOfDay(
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String language) {
        Optional<ProblemBank.Problem> pick = problemBank.problemOfDay(topic, language);
        return pick.map(p -> ResponseEntity.ok(Map.of("problem", problemBank.toJson(p))))
                .orElseGet(() -> ResponseEntity.ok(Map.of("problem", Map.of())));
    }

    @GetMapping("/review")
    public ResponseEntity<?> review(
            @RequestParam(required = false) String date,
            HttpServletRequest request) {
        var session = sessionService.getSession(readToken(request));
        if (session.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        LocalDate day = null;
        if (date != null && !date.isBlank()) {
            try {
                day = LocalDate.parse(date);
            } catch (Exception ignored) {
                // fall back to today
            }
        }
        List<Map<String, Object>> items = new ArrayList<>();
        for (ReviewService.ReviewItem item : reviewService.due(session.get().id(), day)) {
            Optional<ProblemBank.Problem> problem = problemBank.findById(item.problemId());
            if (problem.isEmpty()) {
                continue;
            }
            Map<String, Object> entry = problemBank.toJson(problem.get());
            entry.put("ease", item.ease());
            entry.put("intervalDays", item.intervalDays());
            entry.put("nextReview", item.nextReview());
            entry.put("repetitions", item.repetitions());
            items.add(entry);
        }
        return ResponseEntity.ok(Map.of("items", items));
    }

    @PostMapping("/problems/answer")
    public ResponseEntity<?> answer(
            @RequestBody String rawBody,
            HttpServletRequest request) {
        var session = sessionService.getSession(readToken(request));
        if (session.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        JsonLike body = JsonBody.parse(rawBody);
        String problemId = body.string("problemId");
        Integer selectedIndex = body.node().get("selectedIndex") != null
                && body.node().get("selectedIndex").isValueNode()
                ? body.node().get("selectedIndex").asInt()
                : null;
        if (problemId == null || selectedIndex == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "problemId and selectedIndex are required"));
        }

        Optional<ProblemBank.Problem> found = problemBank.findById(problemId);
        if (found.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Problem not found"));
        }
        ProblemBank.Problem problem = found.get();
        boolean correct = selectedIndex == problem.answerIndex();

        reviewService.recordAnswer(session.get().id(), problemId, correct);
        progressService.recordPractice(session.get().id(), problem.topic(), correct);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("correct", correct);
        out.put("answerIndex", problem.answerIndex());
        out.put("explanation", problem.explanation());
        return ResponseEntity.ok(out);
    }

    private String readToken(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return auth.substring(7);
        }
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (cookie.getName().equals(SESSION_COOKIE)) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
