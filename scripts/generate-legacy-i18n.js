// Regenerates frontend-legacy/js/i18n.js and frontend-legacy/js/i18n/*.js from
// src/lib/translations/ and the language list in src/contexts/LanguageContext.tsx.
// Run from the repository root: node scripts/generate-legacy-i18n.js
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const i18nDir = path.join(root, "frontend-legacy", "js", "i18n");

const languages = readLanguages();
if (languages.length === 0) {
    console.error("no languages found");
    process.exit(1);
}

fs.mkdirSync(i18nDir, { recursive: true });

// One file per language: TRANSLATION_TABLES["code"] = { ... };
for (const l of languages) {
    const content = readTranslation(l.code);
    const file = "TRANSLATION_TABLES[" + JSON.stringify(l.code) + "] = " + content + ";\n";
    fs.writeFileSync(path.join(i18nDir, l.code + ".js"), file);
}

const langEntries = languages
    .map(function (l) {
        return '    { code: "' + l.code + '", name: "' + escapeAscii(l.name) + '" }';
    })
    .join(",\n");

const enContent = readTranslation("en");

const out =
    "// Auto-generated from src/lib/translations. Do not edit by hand.\n" +
    "var LANGUAGES = [\n" +
    langEntries +
    "\n];\n" +
    "var TRANSLATION_TABLES = {};\n" +
    'TRANSLATION_TABLES["en"] = ' +
    enContent +
    ";\n" +
    "(function () {\n" +
    "    var lang = null;\n" +
    '    var parts = document.cookie.split(";");\n' +
    "    for (var i = 0; i < parts.length; i++) {\n" +
    "        var p = parts[i];\n" +
    '        while (p.charAt(0) === " ") { p = p.substring(1); }\n' +
    '        if (p.indexOf("preferred-language=") === 0) { lang = p.substring(19); }\n' +
    "    }\n" +
    "    var known = false;\n" +
    "    for (var j = 0; j < LANGUAGES.length; j++) {\n" +
    "        if (LANGUAGES[j].code === lang) { known = true; break; }\n" +
    "    }\n" +
    '    if (known && lang !== "en") {\n' +
    "        document.write('<script type=\"text/javascript\" src=\"/legacy/js/i18n/' + lang + '.js\"><\\/script>');\n" +
    "    }\n" +
    "})();\n";

const target = path.join(root, "frontend-legacy", "js", "i18n.js");
fs.writeFileSync(target, out);
console.log(
    "generated",
    target,
    "(" + out.length + " bytes) and",
    i18nDir,
    "(" + languages.length + " language files)",
);

function readLanguages() {
    const src = fs.readFileSync(path.join(root, "src", "contexts", "LanguageContext.tsx"), "utf8");
    const list = [];
    const re = /\{\s*code:\s*"([^"]+)",\s*name:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
    let m;
    while ((m = re.exec(src)) !== null) {
        list.push({ code: m[1], name: m[2].replace(/\\"/g, '"') });
    }
    return list;
}

function readTranslation(code) {
    const file = path.join(root, "src", "lib", "translations", code + ".ts");
    const src = fs.readFileSync(file, "utf8");
    const marker = "Translations = ";
    const at = src.indexOf(marker);
    if (at < 0) {
        throw new Error("no Translations = marker in " + file);
    }
    const start = src.indexOf("{", at + marker.length);
    if (start < 0) {
        throw new Error("no object found in " + file);
    }
    let depth = 0;
    let end = -1;
    for (let i = start; i < src.length; i++) {
        if (src[i] === "{") {
            depth++;
        } else if (src[i] === "}") {
            depth--;
            if (depth === 0) {
                end = i + 1;
                break;
            }
        }
    }
    if (end < 0) {
        throw new Error("unbalanced object in " + file);
    }
    return src.slice(start, end);
}

function escapeAscii(text) {
    let out = "";
    for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        if (c > 127) {
            out += "\\u" + ("000" + c.toString(16)).slice(-4);
        } else if (text[i] === '"') {
            out += '\\"';
        } else if (text[i] === "\\") {
            out += "\\\\";
        } else {
            out += text[i];
        }
    }
    return out;
}
