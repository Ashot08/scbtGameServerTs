import { ISqlite } from 'sqlite';
import BaseModel from './BaseModel.ts';
import db from '../index.ts';
import RunResult = ISqlite.RunResult;

export interface AnswerReadOptions {
  id?: number,
}

export interface AnswerOptions {
  turnId: number,
  gameId: number,
  playerId: number,
  rollId: number,
  questionId: number,
  isCountable: 'true' | 'false',
  status: 'error' | 'success' | 'in_process',
}
class Answer extends BaseModel {
  async read(options: AnswerReadOptions) {
    if (options.hasOwnProperty('id')) {
      return db.get('SELECT * FROM answers WHERE id = ?', options.id);
    }
    return db.all(
      'SELECT * FROM answers',
    );
  }

  async create(options: AnswerOptions): Promise<RunResult> {
    const {
      turnId,
      gameId,
      playerId,
      rollId,
      questionId,
      isCountable,
      status,
    } = options;
    return db.run(
      `INSERT INTO 
            answers (turn_id, game_id, player_id, roll_id, question_id, is_countable, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [turnId, gameId, playerId, rollId, questionId, isCountable, status],
    );
  }

  async updateAnswerStatus(status: 'error' | 'success' | 'in_process', answerId: number) {
    return db.run(`UPDATE answers SET status = ? 
        WHERE id = ?`, status, answerId);
  }

  async updateExpiredAnswerStatus(status: 'error' | 'success' | 'in_process', gameId: number) {
    return db.run(`UPDATE answers SET status = ? 
        WHERE game_id = ? 
        AND status = 'in_process'`, status, gameId);
  }

  async getAnswers(gameId: number) {
    return db.all(`SELECT * FROM answers 
        WHERE game_id = ? 
        ORDER BY id ASC`, gameId);
  }

  update = undefined;

  delete = undefined;
}

export default new Answer();
