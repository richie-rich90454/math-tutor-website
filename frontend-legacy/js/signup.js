// MathTutor AI - Legacy signup page logic (IE6-compatible).
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

        el("signupForm").onsubmit = function (e) {
            if (e && e.preventDefault) {
                e.preventDefault();
            }
            var name = el("name").value;
            var email = el("email").value;
            var password = el("password").value;
            var mathLevel = el("mathLevel").value;

            if (!name || name.length < 2) {
                showError(MathTutor.t("authNameTooShort"));
                return false;
            }
            if (!email || email.indexOf("@") === -1) {
                showError(MathTutor.t("authInvalidEmail"));
                return false;
            }
            if (!password || password.length < 8) {
                showError(MathTutor.t("authPasswordTooShort"));
                return false;
            }

            el("submitBtn").disabled = true;
            MathTutor.api({
                url: "/api/auth/signup",
                method: "POST",
                data: { name: name, email: email, password: password, math_level: mathLevel },
                success: function (data) {
                    MathTutor.session = { user: data.user };
                    location.href = "index.html";
                },
                error: function (msg) {
                    showError(msg || MathTutor.t("authSignupFailed"));
                    el("submitBtn").disabled = false;
                }
            });
            return false;
        };
    }

    function showError(msg) {
        var box = el("errorBox");
        MathTutor.setText(box, msg);
        box.className = "auth-msg";
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        init();
    } else {
        $(document).ready(init);
    }
})(jQuery);
