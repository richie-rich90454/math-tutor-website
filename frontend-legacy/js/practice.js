// MathTutor AI - Legacy practice page logic (IE6-compatible).
(function ($) {
    "use strict";

    var TOPICS = ["arithmetic", "algebra", "geometry", "calculus", "trigonometry", "statistics"];
    var pool = [];
    var index = 0;
    var selected = -1;
    var topic = "arithmetic";
    var grade = "all";
    var streak = 0;
    var correctCount = 0;
    var totalCount = 0;
    var reviewMode = false;

    function el(id) {
        return document.getElementById(id);
    }

    function buildLangSwitcher() {
        var host = el("langSwitcher");
        var html = '<select id="langSelect">';
        for (var i = 0; i < MathTutor.languages.length; i++) {
            var lang = MathTutor.languages[i];
            html += '<option value="' + lang.code + '">' + lang.name + "</option>";
        }
        html += "</select>";
        host.innerHTML = html;
        var sel = el("langSelect");
        sel.value = MathTutor.currentLanguage;
        $(sel).on("change", function () {
            MathTutor.setLanguage(this.value);
            loadProblems();
        });
    }

    function renderTopicChips() {
        var host = el("topicChips");
        var html = "";
        for (var i = 0; i < TOPICS.length; i++) {
            var tp = TOPICS[i];
            html += '<a href="#" data-topic="' + tp + '" class="chip'
                + (tp === topic && !reviewMode ? " chip-active" : "") + '">' + MathTutor.escapeHtml(tp) + "</a> ";
        }
        host.innerHTML = html;
        $(host).off("click").on("click", "a[data-topic]", function (e) {
            e.preventDefault();
            topic = this.getAttribute("data-topic");
            reviewMode = false;
            renderTopicChips();
            loadProblems();
        });
    }

    function loadProblems() {
        var params = "topic=" + encodeURIComponent(topic)
            + "&language=" + encodeURIComponent(MathTutor.currentLanguage);
        if (grade !== "all") {
            params += "&grade=" + grade;
        }
        params += "&limit=50";
        MathTutor.api({
            url: "/api/problems?" + params,
            method: "GET",
            success: function (data) {
                pool = data.problems || [];
                index = 0;
                selected = -1;
                reviewMode = false;
                renderQuestion();
            },
            error: function (msg) {
                showError(msg);
            }
        });
    }

    function startReview() {
        MathTutor.api({
            url: "/api/review",
            method: "GET",
            success: function (data) {
                var items = data.items || [];
                if (!items.length) {
                    el("reviewCard").className = "card hidden";
                    return;
                }
                pool = items;
                index = 0;
                selected = -1;
                reviewMode = true;
                renderTopicChips();
                renderQuestion();
            },
            error: function () {
            }
        });
    }

    function renderQuestion() {
        renderStats();
        var card = el("questionCard");
        if (!pool.length) {
            el("questionTag").textContent = " ";
            el("questionText").textContent = " ";
            el("optionsList").innerHTML = '<p class="muted">' + MathTutor.escapeHtml(MathTutor.t("practiceDone")) + "</p>";
            el("feedback").className = "hidden";
            el("aiHelp").className = "hidden";
            return;
        }
        var current = pool[index];
        if (index >= pool.length) {
            index = pool.length - 1;
        }
        el("questionTag").textContent = current.topic + " · G" + current.grade;
        el("questionText").textContent = current.question;
        var html = "";
        for (var i = 0; i < current.options.length; i++) {
            html += '<div class="row"><a href="#" data-option="' + i + '" class="option-btn">'
                + MathTutor.escapeHtml(String.fromCharCode(65 + i) + ". " + current.options[i]) + "</a></div>";
        }
        el("optionsList").innerHTML = html;
        el("feedback").className = "hidden";
        el("aiHelp").className = "hidden";
        $(el("optionsList")).off("click").on("click", "a[data-option]", function (e) {
            e.preventDefault();
            if (selected !== -1) {
                return;
            }
            answer(parseInt(this.getAttribute("data-option"), 10));
        });
    }

    function answer(optionIndex) {
        if (selected !== -1) {
            return;
        }
        var current = pool[index];
        selected = optionIndex;
        var correct = optionIndex === current.answerIndex;
        totalCount += 1;
        if (correct) {
            correctCount += 1;
            streak += 1;
        } else {
            streak = 0;
        }
        renderStats();
        MathTutor.api({
            url: "/api/problems/answer",
            method: "POST",
            data: { problemId: current.id, selectedIndex: optionIndex },
            error: function () {
            }
        });
        var resultEl = el("feedbackResult");
        resultEl.style.color = correct ? "#22c55e" : "#dc2626";
        resultEl.textContent = correct
            ? MathTutor.t("practiceCorrect")
            : MathTutor.t("practiceIncorrect");
        el("feedbackExplanation").textContent = MathTutor.t("practiceExplanation") + ": " + current.explanation;
        el("feedback").className = "";
    }

    function renderStats() {
        el("streakVal").textContent = String(streak);
        var accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
        el("accuracyVal").textContent = accuracy + "%";
        el("progressVal").textContent = totalCount + "/" + Math.max(pool.length, totalCount);
    }

    function nextQuestion() {
        selected = -1;
        if (index + 1 < pool.length) {
            index += 1;
        } else {
            pool = [];
            index = 0;
        }
        renderQuestion();
    }

    // Ask AI for help: one on-demand call. The backend streams text/plain, so a
    // plain text request waits for the full response and shows it inline.
    function askAi() {
        if (!pool.length) {
            return;
        }
        var current = pool[index];
        var host = el("aiHelp");
        host.innerHTML = '<span class="muted">' + MathTutor.escapeHtml(MathTutor.t("loading")) + "</span>";
        host.className = "";
        $.ajax({
            url: API_BASE_URL + "/api/chat/message",
            type: "POST",
            dataType: "text",
            contentType: "application/json",
            data: JSON.stringify({
                message: "Help me with this practice problem: " + current.question,
                chatId: null,
                preferredLanguage: MathTutor.currentLanguage
            }),
            success: function (text) {
                host.innerHTML = '<strong>' + MathTutor.escapeHtml(MathTutor.t("practiceAskAI")) + "</strong><br>"
                    + MathTutor.renderMarkdownSafe(text);
            },
            error: function (xhr) {
                host.innerHTML = MathTutor.escapeHtml(MathTutor.t("errorNetwork"));
            }
        });
    }

    function loadReview() {
        MathTutor.api({
            url: "/api/review",
            method: "GET",
            success: function (data) {
                var n = (data.items || []).length;
                var card = el("reviewCard");
                if (n > 0) {
                    el("reviewText").textContent = MathTutor.t("reviewDue") + ": " + n + " "
                        + MathTutor.t("reviewDueToday");
                    card.className = "card";
                } else {
                    card.className = "card hidden";
                }
            },
            error: function () {
            }
        });
    }

    function loadPlan() {
        MathTutor.api({
            url: "/api/study-plan",
            method: "GET",
            success: function (data) {
                el("planText").textContent = data.plan || "";
            },
            error: function () {
            }
        });
    }

    function generatePlan() {
        MathTutor.api({
            url: "/api/study-plan/generate",
            method: "POST",
            data: { language: MathTutor.currentLanguage },
            success: function (data) {
                el("planText").textContent = data.plan || "";
            },
            error: function (msg) {
                showError(msg);
            }
        });
    }

    function showError(msg) {
        var box = el("errorBox");
        box.textContent = msg;
        box.className = "auth-msg";
    }

    function init() {
        var savedLang = MathTutor.getCookie("preferred-language") || "en";
        MathTutor.currentLanguage = savedLang;
        MathTutor.applyLang(savedLang);
        MathTutor.applyTheme(MathTutor.getTheme());
        buildLangSwitcher();
        renderTopicChips();

        var queryTopic = null;
        try {
            var m = /[?&]topic=([^&]+)/.exec(location.search);
            if (m) {
                queryTopic = decodeURIComponent(m[1]);
            }
        } catch (e) {
        }
        if (queryTopic && TOPICS.indexOf(queryTopic) !== -1) {
            topic = queryTopic;
            renderTopicChips();
        }

        el("gradeSelect").onchange = function () {
            grade = this.value;
            loadProblems();
        };
        el("startReviewBtn").onclick = function () {
            startReview();
            return false;
        };
        el("nextBtn").onclick = function () {
            nextQuestion();
            return false;
        };
        el("askAiBtn").onclick = function () {
            askAi();
            return false;
        };
        el("genPlanBtn").onclick = function () {
            generatePlan();
            return false;
        };

        MathTutor.refreshSession(function (ok) {
            if (!ok) {
                location.href = "login.html";
                return;
            }
            loadProblems();
            loadReview();
            loadPlan();
        });
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        init();
    } else {
        $(document).ready(init);
    }
})(jQuery);
