-- SQLite clear script (USE WITH CAUTION: destroys all data)
-- Marked as undesired for normal use. Only for development reset.
DROP TABLE IF EXISTS usage_logs;
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS chat_sessions;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;
