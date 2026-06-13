/**
 * Clear script - removes the SQLite database to reset all data.
 * Usage: node scripts/clear.js
 */
const path = require("path");
const fs = require("fs");

const dbPath = path.join(process.cwd(), "data", "math-tutor.db");
const walPath = dbPath + "-wal";
const shmPath = dbPath + "-shm";

let removed = false;

for (const p of [dbPath, walPath, shmPath]) {
    if (fs.existsSync(p)) {
        fs.unlinkSync(p);
        console.log("Removed:", path.relative(process.cwd(), p));
        removed = true;
    }
}

if (removed) {
    console.log("Database cleared successfully.");
} else {
    console.log("No database file found at:", dbPath);
}

// Remove data directory if empty
const dbDir = path.dirname(dbPath);
if (fs.existsSync(dbDir) && fs.readdirSync(dbDir).length === 0) {
    fs.rmdirSync(dbDir);
    console.log("Removed empty data directory.");
}