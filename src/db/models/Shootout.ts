import { ISqlite } from 'sqlite';
import BaseModel from './BaseModel.ts';
import db from '../index.ts';
import RunResult = ISqlite.RunResult;

export type GameStatus = 'created' | 'in_process' | 'finished';
export interface CreateShootoutData {
  status?: 'ready' | 'in_process' | 'finished';
  gameId: number;
  questionId: number;
  level: number;
  players: string;
}

export interface ShootoutPlayersAnswers {
  shootoutId: number;
  playerId: number;
  successAnswers: number;
  answersCount: number;
}

export interface ShootoutReadOptions {
  id?: number,
}

class Shootout extends BaseModel {
  async create(data: CreateShootoutData): Promise<RunResult> {
    const {
      gameId,
      questionId,
      level,
      players,
    } = data;

    return db.run(
      `INSERT INTO shootout (
            status,
            game_id,
            question_id,
            level,
            players ) 
            VALUES (?, ?, ?, ?, ?)
      `,
      [
        'ready',
        gameId,
        questionId,
        level,
        players],
    );
  }

  async createShootoutPlayersAnswers(data: ShootoutPlayersAnswers): Promise<RunResult> {
    const {
      shootoutId,
      playerId,
      successAnswers,
      answersCount,
    } = data;

    return db.run(
      `INSERT INTO shootout_players_answers (
            shootout_id,
            player_id,
            answers_count,
            success_answers) 
            VALUES (?, ?, ?, ?)
      `,
      [
        shootoutId,
        playerId,
        successAnswers,
        answersCount,
      ],
    );
  }

  update = undefined;

  async read(options: ShootoutReadOptions) {
    if (options.hasOwnProperty('id')) {
      return db.get('SELECT * FROM shootout WHERE id = ?', options.id);
    }
    return db.all(
      'SELECT * FROM games',
    );
  }

  async getShootoutByGameId(gameId: number) {
      return db.get('SELECT * FROM shootout WHERE game_id = ?', gameId);
  }

  async getShootoutPlayersAnswers(shootoutId: number) {
    return db.all('SELECT * FROM shootout_players_answers WHERE shootout_id = ?', shootoutId);
  }

  async updateStatus(status: CreateShootoutData['status'], gameId: number) {
    return db.run('UPDATE shootout SET status = ? WHERE game_id = ?', status, gameId);
  }

  async updateLevel(level: number, gameId: number) {
    return db.run('UPDATE shootout SET level = ? WHERE game_id = ?', level, gameId);
  }

  async updateQuestionId(questionId: number, gameId: number) {
    return db.run('UPDATE shootout SET question_id = ? WHERE game_id = ?', questionId, gameId);
  }

  async updateShootoutPlayersAnswersSuccessAnswers(newCount: number, shootoutId: number, playerId: number) {
    return db.run(`UPDATE shootout_players_answers SET success_answers = ? WHERE shootout_id = ?
        AND player_id = ?`,
      newCount, shootoutId, playerId);
  }

  async updateShootoutPlayersAnswersAnswersCount(newCount: number, shootoutId: number, playerId: number) {
    return db.run(`UPDATE shootout_players_answers SET answers_count = ? WHERE shootout_id = ?
        AND player_id = ?`,
      newCount, shootoutId, playerId);
  }

  delete = undefined;
}

export default new Shootout();
