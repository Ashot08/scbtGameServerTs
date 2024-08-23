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
      password TEXT,
      type TEXT
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
      end_date TEXT,
      moderator_mode TEXT,
      brigadier_mode TEXT,
      brigadier_stage TEXT,
      brigadier_questions_count INTEGER,
      answers_mode TEXT,
      shift_change_mode TEXT,
      show_roll_result_mode TEXT,
      answer_time INTEGER,
      players_order TEXT,
      startTime TEXT
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
  CREATE TABLE IF NOT EXISTS games_questionsCats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER,
      questionCat_id INTEGER,
      FOREIGN KEY (game_id) REFERENCES games (id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (questionCat_id) REFERENCES questionCats (id) ON UPDATE CASCADE ON DELETE CASCADE
  );
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS questionCats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      slug TEXT UNIQUE,
      order_number INTEGER,
      parent_id INTEGER,
      active TEXT,
      FOREIGN KEY (parent_id) REFERENCES questionCats(id) ON DELETE SET NULL
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
      result_id INTEGER,
      FOREIGN KEY (turn_id) REFERENCES turns (id) ON UPDATE CASCADE ON DELETE CASCADE 
  );
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      turn_id INTEGER,
      game_id INTEGER,
      player_id INTEGER,
      roll_id INTEGER,
      question_id INTEGER,
      is_active_player_question TEXT,
      start_time number,
      end_time number,
      status TEXT,
      FOREIGN KEY (game_id) REFERENCES games (id) ON UPDATE CASCADE ON DELETE CASCADE 
  );
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS players_state (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER,
      game_id INTEGER,
      workers_alive INTEGER,
      active_worker INTEGER,
      next_worker_index INTEGER,
      next_worker_mode TEXT,
      money INTEGER,
      defends INTEGER,
      active_defends_scheme TEXT,
      not_active_defends_scheme TEXT,
      workers_positions_scheme TEXT,
      accident_difficultly INTEGER,
      ready TEXT,  
      questions_to_active_def_count INTEGER,  
      questions_without_def_count INTEGER,  
      questions_to_next_worker_count INTEGER,  
      no_more_rolls TEXT,  
      brigadier_defends_count INTEGER,   
      FOREIGN KEY (game_id) REFERENCES games (id) ON UPDATE CASCADE ON DELETE CASCADE, 
      FOREIGN KEY (player_id) REFERENCES players (id) ON UPDATE CASCADE ON DELETE CASCADE 
  );
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT,
      difficulty INTEGER,
      type INTEGER  
  );
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT,
      correct TEXT,
      question_id INTEGER ,
      FOREIGN KEY (question_id) REFERENCES questions (id) ON UPDATE CASCADE ON DELETE CASCADE  
  );
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS questions_questionCats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER ,
      questionCat_id INTEGER ,
      FOREIGN KEY (question_id) REFERENCES questions (id) ON UPDATE CASCADE ON DELETE CASCADE  
      FOREIGN KEY (questionCat_id) REFERENCES questionCats (id) ON UPDATE CASCADE ON DELETE CASCADE  
  );
`);

export default db;
