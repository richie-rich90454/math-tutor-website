// Minifies all JSON bundled by the frontend so builds ship compact data.
// Idempotent: already-minified files are left untouched.
// Run from the repository root: node scripts/minify-json.js
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "src");

const files = [];
(function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full);
        } else if (entry.name.endsWith(".json")) {
            files.push(full);
        }
    }
})(srcDir);

let count = 0;
let saved = 0;
for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const min = JSON.stringify(JSON.parse(raw)) + "\n";
    if (min !== raw) {
        fs.writeFileSync(file, min);
        count++;
        saved += raw.length - min.length;
    }
}
console.log("minified " + count + " json file(s), saved " + saved + " bytes");
