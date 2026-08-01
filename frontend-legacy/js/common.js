// MathTutor AI - Legacy client shared core.
// Written in ES3 for Internet Explorer 6 compatibility.
// Security: all API/user content is inserted via .text() or escaped
// manually; .html() is never used with untrusted data.

var MathTutor = MathTutor || {};

// ES3 shims for legacy browsers (IE6/IE7).
if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, "");
    };
}
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (needle) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] === needle) {
                return i;
            }
        }
        return -1;
    };
}
if (!Array.prototype.lastIndexOf) {
    Array.prototype.lastIndexOf = function (needle) {
        for (var i = this.length - 1; i >= 0; i--) {
            if (this[i] === needle) {
                return i;
            }
        }
        return -1;
    };
}
// Very old JScript engines (IE5.5/IE6) may lack the ES3 URI functions.
if (!window.encodeURIComponent) {
    window.encodeURIComponent = function (s) {
        s = String(s);
        return s.replace(/[^A-Za-z0-9_.!~*'()-]/g, function (c) {
            return "%" + c.charCodeAt(0).toString(16).toUpperCase();
        });
    };
}
if (!window.decodeURIComponent) {
    window.decodeURIComponent = function (s) {
        return String(s).replace(/%[0-9A-Fa-f]{2}/g, function (m) {
            return String.fromCharCode(parseInt(m.substring(1), 16));
        });
    };
}

// Create an XHR that works in IE6 (no native XMLHttpRequest).
MathTutor.createXHR = function () {
    if (window.XMLHttpRequest) {
        return new XMLHttpRequest();
    }
    try {
        return new ActiveXObject("Msxml2.XMLHTTP");
    } catch (e) {
        try {
            return new ActiveXObject("Microsoft.XMLHTTP");
        } catch (e2) {
            return null;
        }
    }
};

// Read an attribute robustly (IE6 getAttribute quirks on custom names).
MathTutor.attr = function (node, name) {
    if (!node) {
        return "";
    }
    var v = node.getAttribute ? node.getAttribute(name) : null;
    if (v === null && node.attributes) {
        for (var i = 0; i < node.attributes.length; i++) {
            if (node.attributes[i].nodeName === name) {
                v = node.attributes[i].nodeValue;
                break;
            }
        }
    }
    return v === null || v === undefined ? "" : String(v);
};

MathTutor.languages = [
    { code: "en", name: "English" },
    { code: "zh-hans", name: "\u6c49\u8bed" },
    { code: "zh-hant", name: "\u6f22\u8a9e" },
    { code: "mn-cyrl", name: "\u041c\u043e\u043d\u0433\u043e\u043b (\u041a\u0438\u0440\u0438\u043b\u043b)" },
    { code: "mn-mong", name: "\u1834\u1830\u183d\u1828\u1834\u182b (\u041c\u043e\u043d\u0433\u043e\u043b)" },
    { code: "bo", name: "\u0f56\u0f7c\u0f51\u0f0b\u0f61\u0f72\u0f42\u0f66\u0f0b" },
    { code: "es", name: "Espa\u00f1ol" },
    { code: "fr", name: "Fran\u00e7ais" },
    { code: "de", name: "Deutsch" },
    { code: "ja", name: "\u65e5\u672c\u8a9e" },
    { code: "ar", name: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
    { code: "he", name: "\u05e2\u05d1\u05e8\u05d9\u05ea" }
];

MathTutor.currentLanguage = "en";
MathTutor.session = null;

// ---------- Cookie helpers (IE6 has no localStorage) ----------
MathTutor.getCookie = function (name) {
    var parts = document.cookie.split(";");
    for (var i = 0; i < parts.length; i++) {
        var pair = parts[i];
        while (pair.charAt(0) === " ") {
            pair = pair.substring(1);
        }
        if (pair.indexOf(name + "=") === 0) {
            return decodeURIComponent(pair.substring(name.length + 1));
        }
    }
    return null;
};

MathTutor.setCookie = function (name, value, days) {
    var expires = "";
    if (days) {
        var d = new Date();
        d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + d.toUTCString();
    }
    document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
};

MathTutor.deleteCookie = function (name) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
};

// ---------- Language ----------
MathTutor.t = function (key) {
    var table = TRANSLATIONS[MathTutor.currentLanguage] || TRANSLATIONS.en;
    var value = table[key];
    if (value === undefined || value === null) {
        value = TRANSLATIONS.en[key];
    }
    return value === undefined || value === null ? key : value;
};

MathTutor.applyLang = function (lang) {
    MathTutor.currentLanguage = lang;
    var table = TRANSLATIONS[lang] || TRANSLATIONS.en;
    var els = document.getElementsByTagName("*");
    for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var key = el.getAttribute && el.getAttribute("data-i18n");
        if (key && table[key] !== undefined) {
            el.textContent = table[key];
        }
        var phKey = el.getAttribute && el.getAttribute("data-i18n-placeholder");
        if (phKey && table[phKey] !== undefined) {
            el.setAttribute("placeholder", table[phKey]);
        }
    }
    if (lang === "ar" || lang === "he") {
        document.body.dir = "rtl";
        document.body.lang = lang;
    } else {
        document.body.dir = "ltr";
        document.body.lang = lang;
    }
};

MathTutor.setLanguage = function (lang) {
    MathTutor.setCookie("preferred-language", lang, 365);
    MathTutor.applyLang(lang);
    MathTutor.saveUserLanguage(lang);
};

MathTutor.saveUserLanguage = function (lang) {
    if (!MathTutor.session || !MathTutor.session.user) {
        return;
    }
    if (MathTutor.session.user.preferred_language === lang) {
        return;
    }
    $.ajax({
        url: API_BASE_URL + "/api/auth/me",
        type: "GET",
        success: function () {
        },
        error: function () {
        }
    });
};

// ---------- Theme ----------
MathTutor.getTheme = function () {
    return MathTutor.getCookie("theme") || "system";
};

MathTutor.applyTheme = function (theme) {
    var resolved = theme;
    if (theme === "system") {
        resolved = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }
    var body = document.body;
    if (resolved === "dark") {
        body.className = body.className.replace(/\btheme-dark\b|\btheme-light\b/g, "").trim() + " theme-dark";
    } else {
        body.className = body.className.replace(/\btheme-dark\b|\btheme-light\b/g, "").trim() + " theme-light";
    }
};

MathTutor.setTheme = function (theme) {
    MathTutor.setCookie("theme", theme, 365);
    MathTutor.applyTheme(theme);
};

// ---------- Session ----------
MathTutor.currentUser = function () {
    return MathTutor.session ? MathTutor.session.user : null;
};

MathTutor.isAuthenticated = function () {
    return !!MathTutor.session && !!MathTutor.session.user;
};

MathTutor.refreshSession = function (callback) {
    $.ajax({
        url: API_BASE_URL + "/api/auth/me",
        type: "GET",
        dataType: "json",
        success: function (data) {
            MathTutor.session = { user: data.user };
            var lang = MathTutor.getCookie("preferred-language")
                || (data.user && data.user.preferred_language)
                || "en";
            MathTutor.applyLang(lang);
            if (callback) {
                callback(true);
            }
        },
        error: function () {
            MathTutor.session = null;
            if (callback) {
                callback(false);
            }
        }
    });
};

// ---------- Safe rendering ----------
MathTutor.escapeHtml = function (text) {
    if (text === null || text === undefined) {
        return "";
    }
    var s = String(text);
    s = s.replace(/&/g, "&amp;");
    s = s.replace(/</g, "&lt;");
    s = s.replace(/>/g, "&gt;");
    s = s.replace(/"/g, "&quot;");
    s = s.replace(/'/g, "&#39;");
    return s;
};

// Render simple markdown-style content safely. Only transforms safe
// characters after HTML escaping; LaTeX delimiters are preserved as text.
MathTutor.renderMarkdownSafe = function (text) {
    var escaped = MathTutor.escapeHtml(text);
    escaped = escaped.replace(/^#{1,6}\s+/gm, "<strong>").replace(/[ \t]+$/gm, "");
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    escaped = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
    return escaped;
};

// ---------- Time formatting ----------
MathTutor.formatTime = function (isoOrSql) {
    if (!isoOrSql) {
        return "";
    }
    var d;
    if (typeof isoOrSql === "string") {
        var s = isoOrSql;
        if (s.indexOf("T") === -1) {
            s = s.replace(" ", "T") + "Z";
        }
        d = new Date(s);
    } else {
        d = isoOrSql;
    }
    if (isNaN(d.getTime())) {
        return "";
    }
    var h = d.getHours();
    var m = d.getMinutes();
    var ap = h >= 12 ? " PM" : " AM";
    if (h > 12) {
        h -= 12;
    }
    if (h === 0) {
        h = 12;
    }
    return h + ":" + (m < 10 ? "0" + m : m) + ap;
};

// ---------- Export ----------
MathTutor.exportChat = function (messages, title, format) {
    var out;
    var i;
    var now = new Date().toLocaleString();
    if (format === "md") {
        out = "# " + title + "\n\n" + MathTutor.t("exportExportedOn") + " " + now + "\n\n---\n\n";
        for (i = 0; i < messages.length; i++) {
            var roleMd = messages[i].role === "user" ? "**" + MathTutor.t("chatYou") + "**" : "**" + MathTutor.t("ciAIMathTutor") + "**";
            out += "### " + roleMd + " \u2014 " + MathTutor.formatTime(messages[i].timestamp) + "\n\n"
                + messages[i].content + "\n\n---\n\n";
        }
    } else {
        out = title + "\n" + MathTutor.t("exportExportedOn") + " " + now + "\n" + repeat("=", 50) + "\n\n";
        for (i = 0; i < messages.length; i++) {
            var role = messages[i].role === "user" ? MathTutor.t("chatYou") : MathTutor.t("ciAIMathTutor");
            out += "[" + role + "] \u2014 " + MathTutor.formatTime(messages[i].timestamp) + "\n"
                + messages[i].content + "\n" + repeat("-", 40) + "\n\n";
        }
    }
    return out;
};

MathTutor.download = function (content, filename) {
    // Legacy-safe download: use a data URI if Blob/URL is unavailable (IE6/7).
    if (typeof Blob !== "undefined" && window.URL && URL.createObjectURL) {
        var blob = new Blob([content], { type: "text/plain" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else {
        var win = window.open("", "_blank");
        if (win) {
            win.document.open();
            win.document.write("<pre>" + MathTutor.escapeHtml(content) + "</pre>");
            win.document.close();
        }
    }
};

function repeat(ch, n) {
    var s = "";
    for (var i = 0; i < n; i++) {
        s += ch;
    }
    return s;
}

// ---------- AJAX wrapper (JSON bodies, error normalization) ----------
// IE6-IE9 XHR only supports GET/POST. For PATCH/DELETE/PUT we fall back to
// POST + ?_method=... which the backend translates via HiddenHttpMethodFilter.
MathTutor.isOldIE = function () {
    var ua = navigator.userAgent;
    var m = /MSIE (\d+)/.exec(ua);
    return !!m && parseInt(m[1], 10) < 10;
};

MathTutor.supportsMethod = function (method) {
    if (MathTutor.isOldIE()) {
        return false;
    }
    try {
        var x = MathTutor.createXHR();
        if (!x) {
            return false;
        }
        x.open(method, "/");
        return true;
    } catch (e) {
        return false;
    }
};

MathTutor.api = function (options) {
    var opts = options || {};
    var data = opts.data;
    var method = opts.method || "GET";
    var url = API_BASE_URL + opts.url;
    if (method !== "GET" && method !== "POST" && !MathTutor.supportsMethod(method)) {
        url += (url.indexOf("?") === -1 ? "?" : "&") + "_method=" + method;
        method = "POST";
    }
    var ajaxOpts = {
        url: url,
        type: method,
        dataType: "json",
        success: opts.success,
        error: function (xhr, status, err) {
            var message = MathTutor.t("errorNetwork");
            try {
                var body = JSON.parse(xhr.responseText);
                if (body && body.error) {
                    message = body.error;
                }
            } catch (e) {
            }
            if (opts.error) {
                opts.error(message, xhr.status, xhr);
            }
        }
    };
    if (data !== undefined) {
        ajaxOpts.contentType = "application/json";
        ajaxOpts.data = JSON.stringify(data);
    }
    $.ajax(ajaxOpts);
};
