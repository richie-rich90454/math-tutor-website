// MathTutor AI - Legacy MathJax v2 loader (IE6-compatible, no CDN).
// MathJax v2.7.9 is vendored under /legacy/mathjax/. It is injected on
// demand via dynamic <script> so the modern client (KaTeX) stays untouched.
(function () {
    var loaded = false;
    var pending = [];
    if (!window.MathJax) {
        // Config must exist before MathJax.js loads; matches the modern
        // client's KaTeX delimiters ($...$ inline, $$...$$ display).
        window.MathJax = {
            jax: ["input/TeX", "output/HTML-CSS"],
            extensions: ["tex2jax.js", "TeX/AMSmath.js", "TeX/AMSsymbols.js"],
            tex2jax: {
                inlineMath: [["$", "$"], ["\\(", "\\)"]],
                displayMath: [["$$", "$$"], ["\\[", "\\]"]]
            },
            showMathMenu: false,
            messageStyle: "none",
            showProcessingMessages: false,
            skipStartupTypeset: true,
            "HTML-CSS": {
                availableFonts: ["TeX"],
                preferredFont: "TeX",
                webFont: "TeX"
            }
        };
    }
    MathTutor.ensureMathJax = function (callback) {
        if (window.MathJax && window.MathJax.Hub) {
            if (callback) {
                callback();
            }
            return;
        }
        if (callback) {
            pending.push(callback);
        }
        if (loaded) {
            return;
        }
        loaded = true;
        var s = document.createElement("script");
        s.type = "text/javascript";
        s.src = "/legacy/mathjax/MathJax.js";
        var done = function () {
            var i;
            for (i = 0; i < pending.length; i++) {
                pending[i]();
            }
            pending = [];
        };
        if (s.readyState !== undefined) {
            s.onreadystatechange = function () {
                if (s.readyState === "loaded" || s.readyState === "complete") {
                    done();
                }
            };
        } else {
            s.onload = done;
        }
        document.getElementsByTagName("head")[0].appendChild(s);
    };
    MathTutor.renderMath = function (root) {
        MathTutor.ensureMathJax(function () {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, root]);
        });
    };
})();
