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
  moderatorMode: boolean,
  answersMode: 'true' | 'false'
}
export interface GameReadOptions {
  id?: number,
  moderatorId?: number,
}

export interface JoinGameOptions {
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
      moderatorMode,
      answersMode,
    } = data;
    return db.run(
      `INSERT INTO 
            games (
            title, 
            status, 
            players_count, 
            moderator, creation_date, moderator_mode, answers_mode) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [title, status, playersCount, moderator, creationDate, moderatorMode, answersMode],
    );
  }

  update = undefined;

  async read(options: GameReadOptions) {
    if (options.hasOwnProperty('id')) {
      return db.get('SELECT * FROM games WHERE id = ?', options.id);
    }
    return db.all(
      'SELECT * FROM games',
    );
  }

  async joinGame(data:JoinGameOptions) {
    const {
      playerId,
      gameId,
    } = data;
    return db.run(
      `INSERT INTO 
            games_players (player_id, game_id) 
            VALUES (?, ?)
      `,
      [playerId, gameId],
    );
  }

  async getPlayersByGameId(options: GameReadOptions) {
    if (options.hasOwnProperty('id')) {
      return db.all(
        `SELECT u.id, u.username, u.name, u.email 
        FROM games_players as g
        JOIN users as u ON u.id = g.player_id
        WHERE g.game_id = ? ORDER BY u.id ASC`,
        options.id,
      );
    }
    return [];
  }

  async getGamesByPlayerId(playerId: number) {
    if (playerId) {
      return db.all(
        `SELECT g.id, g.title, g.status 
        FROM games_players as gp
        JOIN games as g ON g.id = gp.game_id
        WHERE gp.player_id = ? ORDER BY g.id ASC`,
        playerId,
      );
    }
    return [];
  }

  async getPlayers(gameId: number) {
    return db.all('SELECT * FROM games_players WHERE game_id = ? ORDER BY id ASC', gameId);
  }

  async getTurns(gameId: number) {
    return db.all('SELECT * FROM turns WHERE game_id = ? ORDER BY id ASC', gameId);
  }

  async updateStatus(status: GameStatus, gameId: number) {
    return db.run('UPDATE games SET status = ? WHERE id = ?', status, gameId);
  }

  async updateAnswersMode(status: 'true' | 'false', gameId: number) {
    return db.run('UPDATE games SET answers_mode = ? WHERE id = ?', status, gameId);
  }

  async createTurn(gameId: number, playerId: number, shift: number): Promise<RunResult> {
    return db.run(
      `INSERT INTO 
            turns (game_id, player_id, shift) 
            VALUES (?, ?, ?)
      `,
      [gameId, playerId, shift],
    );
  }

  async createRoll(turnId: number, resultId: number): Promise<RunResult> {
    return db.run(
      `INSERT INTO 
            rolls (turn_id, result_id) 
            VALUES (?, ?)
      `,
      [turnId, resultId],
    );
  }

  async getRolls(turnId: number) {
    return db.all('SELECT * FROM rolls WHERE turn_id = ? ORDER BY id ASC', turnId);
  }

  delete = undefined;
}

export default new Game();
