// MathTutor AI - Legacy formula/glossary sheets page logic (IE6-compatible).
(function ($) {
    "use strict";

    var TOPICS = ["arithmetic", "algebra", "geometry", "calculus", "trigonometry", "statistics"];
    var active = "algebra";

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
        });
    }

    function renderTopicChips() {
        var host = el("topicChips");
        var html = "";
        for (var i = 0; i < TOPICS.length; i++) {
            var tp = TOPICS[i];
            html += '<a href="#" data-topic="' + tp + '" class="chip'
                + (tp === active ? " chip-active" : "") + '">' + MathTutor.escapeHtml(tp) + "</a> ";
        }
        host.innerHTML = html;
        $(host).off("click").on("click", "a[data-topic]", function (e) {
            e.preventDefault();
            active = this.getAttribute("data-topic");
            renderTopicChips();
            loadSheet();
        });
    }

    function loadSheet() {
        MathTutor.api({
            url: "/api/sheets?topic=" + encodeURIComponent(active),
            method: "GET",
            success: function (data) {
                var sheet = data.sheet;
                if (!sheet) {
                    return;
                }
                renderFormulas(sheet.formulas || []);
                renderTerms(sheet.terms || []);
                MathTutor.renderMath(el("formulasList"));
                MathTutor.renderMath(el("termsList"));
            },
            error: function (msg) {
                var box = el("errorBox");
                box.textContent = msg;
                box.className = "auth-msg";
            }
        });
    }

    function renderFormulas(formulas) {
        var host = el("formulasList");
        if (!formulas.length) {
            host.innerHTML = '<span class="muted">-</span>';
            return;
        }
        var html = "";
        for (var i = 0; i < formulas.length; i++) {
            var f = formulas[i];
            html += '<div class="row">'
                + '<span style="min-width:140px;"><strong>' + MathTutor.escapeHtml(f.name) + "</strong></span>"
                + '<code style="flex:1;">' + MathTutor.escapeHtml(f.formula) + "</code>"
                + '<span class="muted">' + MathTutor.escapeHtml(f.mandarin) + "</span>"
                + "</div>";
        }
        host.innerHTML = html;
    }

    function renderTerms(terms) {
        var host = el("termsList");
        if (!terms.length) {
            host.innerHTML = '<span class="muted">-</span>';
            return;
        }
        var html = "";
        for (var i = 0; i < terms.length; i++) {
            var term = terms[i];
            html += '<div class="row"><span style="flex:1;"><strong>' + MathTutor.escapeHtml(term.term) + "</strong></span>"
                + '<span class="muted">' + MathTutor.escapeHtml(MathTutor.t("sheetsMandarin") + ": " + term.mandarin) + "</span></div>";
        }
        host.innerHTML = html;
    }

    function init() {
        var savedLang = MathTutor.getCookie("preferred-language") || "en";
        MathTutor.currentLanguage = savedLang;
        MathTutor.applyLang(savedLang);
        MathTutor.applyTheme(MathTutor.getTheme());
        buildLangSwitcher();
        renderTopicChips();
        loadSheet();
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        init();
    } else {
        $(document).ready(init);
    }
})(jQuery);
