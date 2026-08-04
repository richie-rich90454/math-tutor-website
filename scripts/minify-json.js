// Generates minified copies of client-bundled JSON so the build ships compact
// data while the editable sources stay pretty.
//   source: src/contexts/context_json/*.json     (editable, tracked)
//   output: src/contexts/context_json_min/*.json (minified, gitignored)
// public/manifest.json is a static config served verbatim, so it is minified in
// place (it is a manifest, not content data). Idempotent: unchanged files are
// left untouched. Run from the repository root: node scripts/minify-json.js
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "src", "contexts", "context_json");
const outDir = path.join(root, "src", "contexts", "context_json_min");

let changed = 0;

function minifyTo(srcFile, outFile) {
    const min = JSON.stringify(JSON.parse(fs.readFileSync(srcFile, "utf8"))) + "\n";
    if (fs.existsSync(outFile) && fs.readFileSync(outFile, "utf8") === min) {
        return false;
    }
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, min);
    return true;
}

if (fs.existsSync(srcDir)) {
    for (const entry of fs.readdirSync(srcDir)) {
        if (!entry.endsWith(".json")) {
            continue;
        }
        if (minifyTo(path.join(srcDir, entry), path.join(outDir, entry))) {
            changed++;
        }
    }
}

if (fs.existsSync(outDir)) {
    for (const entry of fs.readdirSync(outDir)) {
        if (!fs.existsSync(path.join(srcDir, entry))) {
            fs.unlinkSync(path.join(outDir, entry));
        }
    }
}

const manifest = path.join(root, "public", "manifest.json");
if (fs.existsSync(manifest)) {
    const raw = fs.readFileSync(manifest, "utf8");
    const min = JSON.stringify(JSON.parse(raw)) + "\n";
    if (min !== raw) {
        fs.writeFileSync(manifest, min);
        changed++;
    }
}

console.log("minified " + changed + " json file(s) -> " + path.relative(root, outDir));
