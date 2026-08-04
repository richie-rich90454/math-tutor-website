// MathTutor AI - Legacy progress page logic (IE6-compatible).
(function ($) {
    "use strict";

    var TOPIC_COLORS = {
        algebra: "#6366f1",
        geometry: "#10b981",
        calculus: "#f59e0b",
        trigonometry: "#ef4444",
        statistics: "#8b5cf6",
        arithmetic: "#06b6d4",
        "linear algebra": "#ec4899",
        "number theory": "#14b8a6",
        "differential equations": "#f97316",
        "word problems": "#64748b"
    };

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
            MathTutor.setLanguage(this.value, loadProgress);
        });
    }

    function loadProgress() {
        MathTutor.api({
            url: "/api/progress",
            method: "GET",
            success: function (data) {
                el("statChats").textContent = String(data.totalChats || 0);
                el("statMessages").textContent = String(data.totalMessages || 0);
                el("statStreak").textContent = String(data.longestStreak || 0);
                el("statTopics").textContent = String((data.topics || []).length);

                renderTopics(data.topics || []);
                renderRecent(data.recentChats || []);
                renderHeatmap(data.dailyActivity || []);
                loadWeakTopics();
            },
            error: function (msg) {
                var box = el("errorBox");
                box.textContent = msg;
                box.className = "auth-msg";
                el("statsRow").className = "stats-table hidden";
                el("topicsCard").className = "card hidden";
                el("recentCard").className = "card hidden";
                el("activityCard").className = "card hidden";
            }
        });
    }

    function renderTopics(topics) {
        var host = el("topicsList");
        if (!topics.length) {
            host.innerHTML = '<span class="muted">' + MathTutor.escapeHtml(MathTutor.t("sidebarNoConversationsYet")) + "</span>";
            return;
        }
        var max = 1;
        for (var i = 0; i < topics.length; i++) {
            if (topics[i].count > max) {
                max = topics[i].count;
            }
        }
        var html = '<table width="100%">';
        for (var j = 0; j < topics.length; j++) {
            var topic = topics[j];
            var color = TOPIC_COLORS[topic.topic] || "#6b7280";
            var width = Math.round((topic.count / max) * 100);
            html += "<tr><td style=\"width:160px;\"><strong>" + MathTutor.escapeHtml(topic.topic) + "</strong></td>"
                + "<td><table width=\"100%\"><tr><td>"
                + '<div style="background:' + color + ";height:12px;width:" + width + "%;\"></div>"
                + "</td></tr></table></td>"
                + "<td style=\"width:40px;text-align:right;\">" + topic.count + "</td></tr>";
        }
        html += "</table>";
        host.innerHTML = html;
    }

    function loadWeakTopics() {
        MathTutor.api({
            url: "/api/progress/suggestions?language=" + encodeURIComponent(MathTutor.currentLanguage),
            method: "GET",
            success: function (data) {
                renderWeakTopics((data.weakTopics || []));
            },
            error: function () {
            }
        });
    }

    function renderWeakTopics(weakTopics) {
        var card = el("weakCard");
        var host = el("weakList");
        if (!card || !weakTopics.length) {
            if (card) {
                card.className = "card hidden";
            }
            return;
        }
        card.className = "card";
        var html = "";
        for (var i = 0; i < weakTopics.length; i++) {
            var weak = weakTopics[i];
            var accuracy = Math.round((weak.accuracy || 0) * 100);
            html += '<div class="row"><strong>' + MathTutor.escapeHtml(weak.topic) + "</strong>"
                + " <span class=\"muted\">" + accuracy + "%</span>"
                + " <a href=\"/legacy/practice.html?topic=" + encodeURIComponent(weak.topic) + "\">"
                + MathTutor.escapeHtml(MathTutor.t("reviewNext")) + " &rarr;</a></div>";
        }
        host.innerHTML = html;
    }

    function renderRecent(recentChats) {        var host = el("recentList");
        if (!recentChats.length) {
            host.innerHTML = '<span class="muted">' + MathTutor.escapeHtml(MathTutor.t("sidebarNoConversationsYet")) + "</span>";
            return;
        }
        var html = "";
        for (var i = 0; i < recentChats.length; i++) {
            var chat = recentChats[i];
            html += '<div class="row"><a href="index.html?chat=' + MathTutor.escapeHtml(chat.id) + '">'
                + MathTutor.escapeHtml(chat.title) + "</a>"
                + (chat.topic ? " <span class=\"muted\">[" + MathTutor.escapeHtml(chat.topic) + "]</span>" : "")
                + " <span class=\"muted\">" + MathTutor.escapeHtml(formatDate(chat.created_at)) + "</span></div>";
        }
        host.innerHTML = html;
    }

    function renderHeatmap(dailyActivity) {
        var host = el("activityHeatmap");
        var html = '<table cellspacing="3"><tr>';
        var today = new Date();
        for (var i = 0; i < 30; i++) {
            var d = new Date(today.getTime() - (29 - i) * 86400000);
            var dateStr = toDateStr(d);
            var count = 0;
            for (var j = 0; j < dailyActivity.length; j++) {
                if (dailyActivity[j].date === dateStr) {
                    count = dailyActivity[j].count;
                    break;
                }
            }
            var intensity = Math.min(count / 3, 1);
            var color = count === 0 ? "#e5e5e5" : rgba(99, 102, 241, 0.2 + intensity * 0.8);
            html += "<td title=\"" + MathTutor.escapeHtml(dateStr + ": " + count + " " + MathTutor.t("progressChats")) + "\""
                + " style=\"width:14px;height:14px;background:" + color + ";\"></td>";
            if ((i + 1) % 10 === 0 && i < 29) {
                html += "</tr><tr>";
            }
        }
        html += "</tr></table>";
        host.innerHTML = html;
    }

    function toDateStr(d) {
        var y = d.getFullYear();
        var m = (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1);
        var day = (d.getDate() < 10 ? "0" : "") + d.getDate();
        return y + "-" + m + "-" + day;
    }

    function rgba(r, g, b, a) {
        // Blend over the card background (IE6 has no rgba() support).
        var bg = document.body.className.indexOf("theme-dark") !== -1 ? 22 : 255;
        var r2 = Math.round(r * a + bg * (1 - a));
        var g2 = Math.round(g * a + bg * (1 - a));
        var b2 = Math.round(b * a + bg * (1 - a));
        return "rgb(" + r2 + "," + g2 + "," + b2 + ")";
    }

    function formatDate(sqlOrIso) {
        if (!sqlOrIso) {
            return "";
        }
        var s = sqlOrIso;
        if (s.indexOf("T") === -1) {
            s = s.replace(" ", "T") + "Z";
        }
        var d = new Date(s);
        if (isNaN(d.getTime())) {
            return "";
        }
        return d.toLocaleDateString();
    }

    function init() {
        var savedLang = MathTutor.getCookie("preferred-language") || "en";
        MathTutor.currentLanguage = savedLang;
        MathTutor.applyLang(savedLang);
        MathTutor.applyTheme(MathTutor.getTheme());
        buildLangSwitcher();

        MathTutor.refreshSession(function (ok) {
            if (!ok) {
                location.href = "login.html";
                return;
            }
            loadProgress();
        });
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        init();
    } else {
        $(document).ready(init);
    }
})(jQuery);
