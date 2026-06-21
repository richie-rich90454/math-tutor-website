const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "src", "app", "api", "chat", "prompts");
const files = fs.readdirSync(dir);

for (const f of files) {
    let t = fs.readFileSync(path.join(dir, f), "utf8");
    const orig = t;
    // Replace curly single quotes with straight apostrophe
    t = t.split("\u2018").join("'");
    t = t.split("\u2019").join("'");
    // Replace curly double quotes with straight double quote
    t = t.split("\u201C").join('"');
    t = t.split("\u201D").join('"');
    if (orig !== t) {
        fs.writeFileSync(path.join(dir, f), t);
        console.log(f + ": fixed");
    }
}
