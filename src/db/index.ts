import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// open the database file
const db = await open({
  filename: 'scbt_game_table.db',
  driver: sqlite3.Database,
});

// create our 'messages' table (you can ignore the 'client_offset' column for now)
await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT
  );
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      name TEXT,
      email TEXT,
      password TEXT
  );
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      status TEXT,
      players_count INTEGER,
      moderator INTEGER,
      creation_date TEXT,
      start_date TEXT,
      end_date TEXT
  );
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS games_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER,
      player_id INTEGER,
      FOREIGN KEY (game_id) REFERENCES games (id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE
  );
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS turns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER,
      player_id INTEGER,
      shift INTEGER,
      FOREIGN KEY (game_id) REFERENCES games (id) ON UPDATE CASCADE ON DELETE CASCADE
  );
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS rolls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      turn_id INTEGER,
      result TEXT,
      FOREIGN KEY (turn_id) REFERENCES turns (id) ON UPDATE CASCADE ON DELETE CASCADE 
  );
`);

export default db;
