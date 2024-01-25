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
  answersMode: 'true' | 'false',
  shiftChangeMode: 'true' | 'false',
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
      shiftChangeMode,
    } = data;
    return db.run(
      `INSERT INTO 
            games (
            title, 
            status, 
            players_count, 
            moderator, creation_date, moderator_mode, answers_mode, shift_change_mode) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [title,
        status,
        playersCount,
        moderator, creationDate, moderatorMode, answersMode, shiftChangeMode],
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

  async createPlayerState(gameId: number, playerId: number): Promise<RunResult> {
    return db.run(
      `INSERT INTO 
            players_state (
            game_id, 
            player_id, 
            workers_alive,
            active_worker,
            money,
            defends,
            active_defends_scheme,
            not_active_defends_scheme,
            workers_positions_scheme,
            accident_difficultly,  
            questions_to_active_def_count,  
            questions_without_def_count,
            ready 
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [gameId, playerId, 6, 0, 10, 0,
        '0,0,0,0,0,0', '0,0,0,0,0,0', '0,0,0,0,0,0',
        0, 0, 0, 'false'
      ],
    );
  }

  async updateShiftChangeMode (gameId: number, shiftChangeMode: string) {
    return db.run('UPDATE games SET shift_change_mode = ? WHERE id = ?', shiftChangeMode, gameId);
  }

  async getPlayersStateByGameId(gameId: number) {
    return db.all('SELECT * FROM players_state WHERE game_id = ? ORDER BY id ASC', gameId);
  }

  async getPlayerState(gameId: number, userId: number) {
    return db.get('SELECT * FROM players_state WHERE game_id = ? AND player_id = ? ORDER BY id ASC', gameId, userId);
  }

  async updateWorkerNotActiveDefends(userId: number, gameId: number, defendsScheme: string) {
    return db.run('UPDATE players_state SET not_active_defends_scheme = ? WHERE player_id = ? AND game_id = ?', defendsScheme, userId, gameId);
  }

  async updateWorkerActiveDefends(userId: number, gameId: number, defendsScheme: string) {
    return db.run('UPDATE players_state SET active_defends_scheme = ? WHERE player_id = ? AND game_id = ?', defendsScheme, userId, gameId);
  }

  async updateWorkersPositions(userId: number, gameId: number, workersPositionsScheme: string) {
    return db.run('UPDATE players_state SET workers_positions_scheme = ? WHERE player_id = ? AND game_id = ?', workersPositionsScheme, userId, gameId);
  }

  async updatePlayerDefends(userId: number, gameId: number, addedDefendsCount: number) {
    return db.run('UPDATE players_state SET defends = ? WHERE player_id = ? AND game_id = ?', addedDefendsCount, userId, gameId);
  }

  async updatePlayerMoney(userId: number, gameId: number, newMoneyValue: number) {
    return db.run('UPDATE players_state SET money = ? WHERE player_id = ? AND game_id = ?', newMoneyValue, userId, gameId);
  }

  async updatePlayerReadyStatus(userId: number, gameId: number, readyStatus: string) {
    return db.run('UPDATE players_state SET ready = ? WHERE player_id = ? AND game_id = ?', readyStatus, userId, gameId);
  }

  delete = undefined;
}

export default new Game();
