// Regenerates frontend-legacy/js/i18n.js from src/lib/translations.ts.
// Run from the repository root: node scripts/generate-legacy-i18n.js
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const src = fs.readFileSync(path.join(root, "src", "lib", "translations.ts"), "utf8");
const marker = "export const translations: Record<string, Translations> =";
const idx = src.indexOf(marker);
if (idx < 0) {
    console.error("translations marker not found");
    process.exit(1);
}

let body = src.slice(idx + marker.length);
body = body.replace(/\}\s*;\s*$/, "}");

const out =
    "// Auto-generated from src/lib/translations.ts. Do not edit by hand.\n" +
    "var TRANSLATIONS = " + body + ";\n";

const target = path.join(root, "frontend-legacy", "js", "i18n.js");
fs.writeFileSync(target, out);
console.log("generated", target, "(" + out.length + " bytes)");
