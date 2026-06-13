/**
 * Setup script - creates the data directory for SQLite database.
 * The database is initialized automatically on first app start.
 * Usage: node scripts/setup.js
 */
const path = require("path");
const fs = require("fs");

const dbDir = path.join(process.cwd(), "data");
const envFile = path.join(process.cwd(), ".env");
const envExample = path.join(process.cwd(), ".env.example");

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log("Created data directory:", dbDir);
} else {
    console.log("Data directory already exists:", dbDir);
}

if (!fs.existsSync(envFile) && fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envFile);
    console.log("Created .env from .env.example (please set your DEEPSEEK_API_KEY)");
} else if (!fs.existsSync(envFile)) {
    console.log("No .env file found. Create one with your DEEPSEEK_API_KEY.");
}

console.log("Setup complete. Run 'npm run dev' to start the application.");
console.log("Database will be created at:", path.join(dbDir, "math-tutor.db"));