-- PostgreSQL clear script (USE WITH CAUTION: destroys all data)
-- Marked as undesired for normal use. Only for development reset.
DROP TABLE IF EXISTS usage_logs CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
