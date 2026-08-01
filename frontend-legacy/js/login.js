// MathTutor AI - Legacy login page logic (IE6-compatible).
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
        });
    }

    function init() {
        var savedLang = MathTutor.getCookie("preferred-language") || "en";
        MathTutor.currentLanguage = savedLang;
        MathTutor.applyLang(savedLang);
        MathTutor.applyTheme(MathTutor.getTheme());
        buildLangSwitcher();

        MathTutor.refreshSession(function (ok) {
            if (ok) {
                location.href = "index.html";
            }
        });

        el("loginForm").onsubmit = function (e) {
            if (e && e.preventDefault) {
                e.preventDefault();
            }
            var email = el("email").value;
            var password = el("password").value;
            var remember = el("remember").checked;

            if (!email || !password) {
                showError(MathTutor.t("authInvalidCredentials"));
                return false;
            }

            el("submitBtn").disabled = true;
            MathTutor.api({
                url: "/api/auth/login",
                method: "POST",
                data: { email: email, password: password, remember: remember },
                success: function (data) {
                    MathTutor.session = { user: data.user };
                    location.href = "index.html";
                },
                error: function (msg) {
                    showError(msg || MathTutor.t("authInvalidCredentials"));
                    el("submitBtn").disabled = false;
                }
            });
            return false;
        };
    }

    function showError(msg) {
        var box = el("errorBox");
        box.textContent = msg;
        box.className = "auth-msg";
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        init();
    } else {
        $(document).ready(init);
    }
})(jQuery);
