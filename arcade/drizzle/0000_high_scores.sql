CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  game TEXT NOT NULL,
  name TEXT NOT NULL,
  value INTEGER NOT NULL,
  created INTEGER NOT NULL,
  UNIQUE(game, name, value)
);
