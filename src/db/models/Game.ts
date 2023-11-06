import { ISqlite } from 'sqlite';
import BaseModel from './BaseModel.ts';
import db from '../index.ts';
import RunResult = ISqlite.RunResult;

export type GameStatus = 'created' | 'in_process' | 'finished';
export interface CreateGameData {
  title: string,
  status: GameStatus,
  playersCount: number,
  moderator: number,
  creationDate: string,
  moderatorMode: boolean
}
export interface GameReadOptions {
  id?: number,
  moderatorId?: number,
}

export interface JoinPlayerData {
  playerId: number,
  gameId: number,
}

class Game extends BaseModel {
  async create(data: CreateGameData): Promise<RunResult> {
    const {
      title,
      status,
      playersCount,
      moderator,
      creationDate,
    } = data;
    return db.run(
      `INSERT INTO 
            games (title, status, players_count, moderator, creation_date) 
            VALUES (?, ?, ?, ?, ?)
      `,
      [title, status, playersCount, moderator, creationDate],
    );
  }

  update = undefined;

  async read(options: GameReadOptions) {
    if (options.hasOwnProperty('moderatorId')) {
      return db.get('SELECT * FROM games WHERE moderator = ?', options.moderatorId);
    }
    if (options.hasOwnProperty('id')) {
      return db.get('SELECT * FROM games WHERE id = ?', options.id);
    }
    return db.all(
      'SELECT * FROM games',
    );
  }

  async joinPlayer(data: JoinPlayerData) {
    const {gameId, playerId} = data;
    return db.run(
      `INSERT INTO 
            games_players (game_id, player_id) 
            VALUES (?, ?)
      `,
      [gameId, playerId],
    );
  }

  delete = undefined;
}

export default new Game();
