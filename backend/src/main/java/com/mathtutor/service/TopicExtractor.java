package com.mathtutor.service;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class TopicExtractor {

    private static final Map<String, List<String>> TOPIC_KEYWORDS = Map.ofEntries(
            Map.entry("algebra", List.of(
                    "algebra", "equation", "variable", "polynomial", "factor", "quadratic",
                    "linear", "inequality", "matrix", "алгебр", "方程式", "الجبر", "algèbre",
                    "Algebra")),
            Map.entry("geometry", List.of(
                    "geometry", "angle", "triangle", "circle", "area", "perimeter", "volume",
                    "surface", "parallel", "perpendicular", "геометр", "几何", "هندسة",
                    "géométrie", "Geometrie")),
            Map.entry("calculus", List.of(
                    "calculus", "derivative", "integral", "limit", "differentiation",
                    "integration", "differential", "optimization", " calculus", "интеграл",
                    "微积分", "حساب التفاضل", "calcul", "分析")),
            Map.entry("trigonometry", List.of(
                    "trigonometry", "sine", "cosine", "tangent", "trig", "angle", "radian",
                    "triangl", "тригонометр", "三角函数", "usul", "trigonométrie",
                    "trigonometrie")),
            Map.entry("statistics", List.of(
                    "statistics", "probability", "mean", "median", "standard deviation",
                    "variance", "distribution", "sample", "статистик", "统计", "إحصاء",
                    "statistique", "Statistik")),
            Map.entry("arithmetic", List.of(
                    "addition", "subtraction", "multiplication", "division", "fraction",
                    "decimal", "percentage", "arithmetic", "算术", "أithmetic",
                    "arithmétique", "Arithmetik")),
            Map.entry("linear algebra", List.of(
                    "matrix", "vector", "eigenvalue", "linear transformation", "determinant",
                    "span", "basis", "линейная алгебр", "线性代数", "جبر خطي",
                    "algèbre linéaire", "Lineare Algebra")),
            Map.entry("number theory", List.of(
                    "prime", "divisibility", "modular", "congruence", "gcd", "lcm",
                    "diophantine", "теория чисел", "数论", "نظرية الأعداد", "théorie des nombres")),
            Map.entry("differential equations", List.of(
                    "differential equation", "ode", "pde", "laplace", "fourier", "уравнение",
                    "微分方程", "المعادلات التفاضلية", "équation différentielle",
                    "Differentialgleichung")),
            Map.entry("word problems", List.of(
                    "word problem", "real world", "application", "scenario", "бодлог",
                    "应用题", "مسألة", "problème", "Anwendung")));

    public String extractTopic(String message) {
        if (message == null) {
            return null;
        }
        String lower = message.toLowerCase();
        String bestTopic = null;
        int bestScore = 0;

        for (Map.Entry<String, List<String>> entry : TOPIC_KEYWORDS.entrySet()) {
            int score = 0;
            for (String kw : entry.getValue()) {
                if (lower.contains(kw.toLowerCase())) {
                    score++;
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestTopic = entry.getKey();
            }
        }
        return bestTopic;
    }
}
