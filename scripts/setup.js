/**
 * Setup script - creates the data directory for SQLite database.
 * The database is initialized automatically on first app start.
 * Usage: node scripts/setup.js
 */
const path = require("path");
const fs = require("fs");

const dbDir = path.join(process.cwd(), "data");

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log("Created data directory:", dbDir);
} else {
    console.log("Data directory already exists:", dbDir);
}

console.log("Setup complete. Run 'npm run dev' to start the application.");
console.log("Database will be created at:", path.join(dbDir, "math-tutor.db"));