import { ISqlite } from 'sqlite';
import BaseModel from './BaseModel.ts';
import db from '../index.ts';
import RunResult = ISqlite.RunResult;

export interface AnswerReadOptions {
  id?: number,
}

export interface WatcherAnswerReadOptions {
  gameId?: number,
  questionId?: number,
  playerId?: number,
}

export interface AnswerOptions {
  turnId: number,
  gameId: number,
  playerId: number,
  rollId: number,
  questionId: number,
  isActivePlayerQuestion: 'true' | 'false',
  status: 'error' | 'success' | 'in_process',
  startTime: number,
  endTime: number,
}

export interface TempAnswerOptions {
  answerId: number,
  gameId: number,
  playerId: number,
  questionId: number,
  variantId: number,
  timestamp: number,
}

export interface WatcherAnswerOptions {
  gameId: number,
  playerId: number,
  questionId: number,
  variantId: number,
  status: string,
  timestamp: number,
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

  async readWatcherAnswers(options: WatcherAnswerReadOptions) {
    if (options.hasOwnProperty('gameId')
      && options.hasOwnProperty('questionId')
      && options.hasOwnProperty('playerId')
    ) {
      return db.get(`SELECT * FROM watcher_answers WHERE game_id = ?
         AND question_id = ?
         AND player_id = ?
        `, [options.gameId, options.questionId, options.playerId]);
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
      isActivePlayerQuestion,
      status,
      startTime,
      endTime,
    } = options;
    return db.run(
      `INSERT INTO 
            answers (turn_id, game_id, player_id, roll_id, question_id, is_active_player_question, status, start_time, end_time) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [turnId, gameId, playerId, rollId, questionId, isActivePlayerQuestion, status, startTime, endTime],
    );
  }

  async createTempAnswer(options: TempAnswerOptions): Promise<RunResult> {
    const {
      answerId,
      gameId,
      playerId,
      questionId,
      variantId,
      timestamp,
    } = options;
    return db.run(
      `INSERT INTO 
            temp_answers (answer_id, game_id, player_id, question_id, variant_id, timestamp) 
            VALUES (?, ?, ?, ?, ?, ?)
      `,
      [answerId, gameId, playerId, questionId, variantId, timestamp],
    );
  }

  async createWatcherAnswer(options: WatcherAnswerOptions): Promise<RunResult> {
    const {
      gameId,
      playerId,
      questionId,
      variantId,
      status,
      timestamp,
    } = options;
    return db.run(
      `INSERT INTO 
            watcher_answers (game_id, player_id, question_id, variant_id, timestamp, status) 
            VALUES (?, ?, ?, ?, ?, ?)
      `,
      [gameId, playerId, questionId, variantId, timestamp, status],
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

  async updateExpiredAnswerEndTime(gameId: number) {
    return db.run(`UPDATE answers SET end_time = ? 
        WHERE game_id = ? 
        AND status = 'in_process'`, Date.now(), gameId);
  }

  async updateAnswerEndTime(endTime: number, answerId: number) {
    return db.run(`UPDATE answers SET end_time = ? 
        WHERE id = ?`, endTime, answerId);
  }

  async getAnswers(gameId: number) {
    return db.all(`SELECT * FROM answers 
        WHERE game_id = ? 
        ORDER BY id ASC`, gameId);
  }

  async getAnswersInProcess(gameId: number) {
    return db.all(`SELECT * FROM answers 
        WHERE game_id = ? 
        AND status = 'in_process'
        ORDER BY id ASC`, gameId);
  }

  async getTempAnswers(gameId: number) {
    return db.all(`SELECT * FROM temp_answers 
        WHERE game_id = ? 
        ORDER BY id ASC`, gameId);
  }

  async getWatcherAnswers(gameId: number) {
    return db.all(`SELECT * FROM watcher_answers 
        WHERE game_id = ? 
        ORDER BY id ASC`, gameId);
  }

  update = undefined;

  delete = undefined;
}

export default new Answer();
