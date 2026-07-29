import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { migrate } from "./db/migrations";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "math-tutor.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
    if (db) return db;

    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    migrate(db);

    return db;
}

export function closeDb(): void {
    if (db) {
        db.close();
        db = null;
    }
}
