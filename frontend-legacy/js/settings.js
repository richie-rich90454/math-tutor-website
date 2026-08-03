// MathTutor AI - Legacy settings page logic (IE6-compatible).
(function ($) {
    "use strict";

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
            reapply();
        });
    }

    function buildLanguageSelect() {
        var sel = el("languageSelect");
        sel.options.length = 0;
        for (var i = 0; i < MathTutor.languages.length; i++) {
            var lang = MathTutor.languages[i];
            sel.options[sel.options.length] = new Option(lang.name, lang.code);
        }
        sel.value = MathTutor.currentLanguage;
        $(sel).on("change", function () {
            MathTutor.setLanguage(this.value);
            var saved = el("langSaved");
            saved.textContent = MathTutor.t("settingsLanguageSaved");
            saved.className = "auth-ok";
            reapply();
        });
    }

    function buildThemeSelect() {
        var sel = el("themeSelect");
        sel.value = MathTutor.getTheme();
        $(sel).on("change", function () {
            MathTutor.setTheme(this.value);
        });
    }

    function loadAccount() {
        MathTutor.refreshSession(function (ok) {
            if (ok) {
                el("accountInfo").className = "";
                el("accountNotSigned").className = "hidden";
                var user = MathTutor.currentUser();
                el("accountEmail").textContent = user.email || "-";
                el("accountName").textContent = user.name || "-";
                el("accountLevel").textContent = user.math_level || "-";
            } else {
                el("accountInfo").className = "hidden";
                el("accountNotSigned").className = "";
            }
        });
    }

    function reapply() {
        MathTutor.applyLang(MathTutor.currentLanguage);
        loadAccount();
    }

    function init() {
        var savedLang = MathTutor.getCookie("preferred-language") || "en";
        MathTutor.currentLanguage = savedLang;
        MathTutor.applyLang(savedLang);
        MathTutor.applyTheme(MathTutor.getTheme());
        buildLangSwitcher();
        buildLanguageSelect();
        buildThemeSelect();
        loadAccount();

        el("signOutBtn").onclick = function () {
            MathTutor.api({
                url: "/api/auth/logout",
                method: "POST",
                success: function () {
                    MathTutor.session = null;
                    location.href = "login.html";
                },
                error: function () {
                    MathTutor.session = null;
                    location.href = "login.html";
                }
            });
            return false;
        };

        el("changePwBtn").onclick = function () {
            var current = el("currentPassword").value;
            var next = el("newPassword").value;
            el("pwOk").className = "auth-ok hidden";
            el("pwError").className = "auth-msg hidden";
            if (next.length < 8) {
                el("pwError").textContent = MathTutor.t("authPasswordTooShort");
                el("pwError").className = "auth-msg";
                return false;
            }
            MathTutor.api({
                url: "/api/auth/change-password",
                method: "POST",
                data: { currentPassword: current, newPassword: next },
                success: function () {
                    el("currentPassword").value = "";
                    el("newPassword").value = "";
                    el("pwOk").textContent = MathTutor.t("settingsPasswordChanged");
                    el("pwOk").className = "auth-ok";
                    loadSessions();
                },
                error: function (msg) {
                    el("pwError").textContent = msg || MathTutor.t("settingsCurrentPasswordWrong");
                    el("pwError").className = "auth-msg";
                }
            });
            return false;
        };

        el("revokeAllBtn").onclick = function () {
            MathTutor.api({
                url: "/api/auth/sessions/revoke-all",
                method: "POST",
                data: {},
                success: function () {
                    loadSessions();
                },
                error: function () {
                }
            });
            return false;
        };

        loadSessions();
    }

    function loadSessions() {
        MathTutor.api({
            url: "/api/auth/sessions",
            method: "GET",
            success: function (data) {
                var n = (data.sessions || []).length;
                el("sessionCountText").textContent = MathTutor.t("settingsSessions") + ": " + n;
            },
            error: function () {
            }
        });
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        init();
    } else {
        $(document).ready(init);
    }
})(jQuery);
