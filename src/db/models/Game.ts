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
  showRollResultMode: 'true' | 'false',
  brigadierMode: 'true' | 'false',
  brigadierStage: 'ready' | 'in_process' | 'finished',
  brigadierQuestionsCount: number,
  answerTime: number,
  playersOrder: string,
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
      showRollResultMode,
      brigadierMode,
      brigadierStage,
      brigadierQuestionsCount,
      answerTime,
      playersOrder,
    } = data;

    return db.run(
      `INSERT INTO 
            games (
            title, 
            status, 
            players_count, 
            moderator, 
            creation_date, 
            moderator_mode, 
            answers_mode, 
            shift_change_mode, 
            show_roll_result_mode, 
            brigadier_mode, brigadier_stage, brigadier_questions_count, answer_time,
            players_order) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title,
        status,
        playersCount,
        moderator,
        creationDate,
        moderatorMode,
        answersMode,
        shiftChangeMode,
        showRollResultMode, brigadierMode, brigadierStage, brigadierQuestionsCount, answerTime, playersOrder],
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

  async deletePlayerFromGame(data:JoinGameOptions) {
    const {
      playerId,
      gameId,
    } = data;
    return db.run(
      `DELETE
            FROM games_players
            WHERE game_id = ? AND player_id = ?;
            `,
      [gameId, playerId],
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

  async updatePlayersCount(count: number, gameId: number) {
    return db.run('UPDATE games SET players_count = ? WHERE id = ?', count, gameId);
  }

  async updateAnswersMode(status: 'true' | 'false', gameId: number) {
    return db.run('UPDATE games SET answers_mode = ? WHERE id = ?', status, gameId);
  }

  async updateBrigadierStage(status: 'ready' | 'in_process' | 'finished', gameId: number) {
    return db.run('UPDATE games SET brigadier_stage = ? WHERE id = ?', status, gameId);
  }

  async updateBrigadierQuestionsCount(count: number, gameId: number) {
    return db.run('UPDATE games SET brigadier_questions_count = ? WHERE id = ?', count, gameId);
  }

  async updateGamePlayersOrder(order: string, gameId: number) {
    return db.run('UPDATE games SET players_order = ? WHERE id = ?', order, gameId);
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

  async deleteTurn(gameId: number, playerId: number): Promise<RunResult> {
    return db.run(
      `DELETE 
            FROM turns
            WHERE game_id = ? AND player_id = ?;
            `,
      [gameId, playerId],
    );
  }

  async deletePlayerState(gameId: number, playerId: number): Promise<RunResult> {
    return db.run(
      `DELETE 
            FROM players_state
            WHERE game_id = ? AND player_id = ?;
            `,
      [gameId, playerId],
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
            ready,
            next_worker_mode,
            next_worker_index,
            questions_to_next_worker_count,
            no_more_rolls,
            brigadier_defends_count,
            ready_to_start_brigadier_answers 
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [gameId, playerId, 6, 0, 10, 0,
        '0,0,0,0,0,0', '0,0,0,0,0,0', '0,0,0,0,0,0',
        0, 0, 0, 'false', 'false', 0, 0, 'false', 0, 'false',
      ],
    );
  }

  async updateShiftChangeMode(gameId: number, shiftChangeMode: string) {
    return db.run('UPDATE games SET shift_change_mode = ? WHERE id = ?', shiftChangeMode, gameId);
  }

  async updateShowRollResultMode(gameId: number, showRollResultMode: string) {
    return db.run('UPDATE games SET show_roll_result_mode = ? WHERE id = ?', showRollResultMode, gameId);
  }

  async getPlayersStateByGameId(gameId: number) {
    return db.all('SELECT * FROM players_state WHERE game_id = ? ORDER BY id ASC', gameId);
  }

  async getPlayerState(gameId: number, userId: number) {
    return db.get(
      'SELECT * FROM players_state WHERE game_id = ? AND player_id = ? ORDER BY id ASC',
      gameId,
      userId,
    );
  }

  async getBrigadierQuestionsCount(gameId: number) {
    return db.get(
      'SELECT brigadier_questions_count FROM games WHERE id = ?',
      gameId,
    );
  }

  async updateWorkerNotActiveDefends(userId: number, gameId: number, defendsScheme: string) {
    return db.run(
      'UPDATE players_state SET not_active_defends_scheme = ? WHERE player_id = ? AND game_id = ?',
      defendsScheme,
      userId,
      gameId,
    );
  }

  async updateWorkerActiveDefends(userId: number, gameId: number, defendsScheme: string) {
    return db.run(
      'UPDATE players_state SET active_defends_scheme = ? WHERE player_id = ? AND game_id = ?',
      defendsScheme,
      userId,
      gameId,
    );
  }

  async updateWorkersPositions(userId: number, gameId: number, workersPositionsScheme: string) {
    return db.run(
      'UPDATE players_state SET workers_positions_scheme = ? WHERE player_id = ? AND game_id = ?',
      workersPositionsScheme,
      userId,
      gameId,
    );
  }

  async updatePlayerDefends(userId: number, gameId: number, addedDefendsCount: number) {
    return db.run(
      'UPDATE players_state SET defends = ? WHERE player_id = ? AND game_id = ?',
      addedDefendsCount,
      userId,
      gameId,
    );
  }

  async updatePlayerMoney(userId: number, gameId: number, newMoneyValue: number) {
    return db.run(
      'UPDATE players_state SET money = ? WHERE player_id = ? AND game_id = ?',
      newMoneyValue,
      userId,
      gameId,
    );
  }

  async updatePlayerWorkersAliveCount(userId: number, gameId: number, newWorkersAliveCount: number) {
    return db.run(
      'UPDATE players_state SET workers_alive = ? WHERE player_id = ? AND game_id = ?',
      newWorkersAliveCount,
      userId,
      gameId,
    );
  }

  async updatePlayerReadyStatus(userId: number, gameId: number, readyStatus: string) {
    return db.run(
      'UPDATE players_state SET ready = ? WHERE player_id = ? AND game_id = ?',
      readyStatus,
      userId,
      gameId,
    );
  }

  async updatePlayerReadyToStartBrigadier(userId: number, gameId: number, readyStatus: string) {
    return db.run(
      'UPDATE players_state SET ready_to_start_brigadier_answers = ? WHERE player_id = ? AND game_id = ?',
      readyStatus,
      userId,
      gameId,
    );
  }

  async updatePlayerBrigadierDefendsCount(userId: number, gameId: number, newDefendsCount: number) {
    return db.run(
      'UPDATE players_state SET brigadier_defends_count = ? WHERE player_id = ? AND game_id = ?',
      newDefendsCount,
      userId,
      gameId,
    );
  }

  async updatePlayerActiveWorker(userId: number, gameId: number, activeWorker: number) {
    return db.run(
      'UPDATE players_state SET active_worker = ? WHERE player_id = ? AND game_id = ?',
      activeWorker,
      userId,
      gameId,
    );
  }

  async updatePlayerNextWorkerIndex(userId: number, gameId: number, nexWorkerIndex: number) {
    return db.run(
      'UPDATE players_state SET next_worker_index = ? WHERE player_id = ? AND game_id = ?',
      nexWorkerIndex,
      userId,
      gameId,
    );
  }

  async updatePlayerNextWorkerMode(userId: number, gameId: number, nextWorkerMode: string) {
    return db.run(
      'UPDATE players_state SET next_worker_mode = ? WHERE player_id = ? AND game_id = ?',
      nextWorkerMode,
      userId,
      gameId,
    );
  }

  async updateNextWorkerQuestionsCount(userId: number, gameId: number, newQuestionsCount: number) {
    return db.run(
      'UPDATE players_state SET questions_to_next_worker_count = ? WHERE player_id = ? AND game_id = ?',
      newQuestionsCount,
      userId,
      gameId,
    );
  }

  async updateAccidentDiff(userId: number, gameId: number, accidentDifficultly: number) {
    return db.run(
      'UPDATE players_state SET accident_difficultly = ? WHERE player_id = ? AND game_id = ?',
      accidentDifficultly,
      userId,
      gameId,
    );
  }

  async updateQuestionsToActivateDef(userId: number, gameId: number, questionsToActivateDefCount: number) {
    return db.run(
      'UPDATE players_state SET questions_to_active_def_count = ? WHERE player_id = ? AND game_id = ?',
      questionsToActivateDefCount,
      userId,
      gameId,
    );
  }

  async updateQuestionsWithoutDef(userId: number, gameId: number, questionsWithoutDefCount: number) {
    return db.run(
      'UPDATE players_state SET questions_without_def_count = ? WHERE player_id = ? AND game_id = ?',
      questionsWithoutDefCount,
      userId,
      gameId,
    );
  }

  async updateNoMoreRolls(userId: number, gameId: number, noMoreRolls: string) {
    return db.run(
      'UPDATE players_state SET no_more_rolls = ? WHERE player_id = ? AND game_id = ?',
      noMoreRolls,
      userId,
      gameId,
    );
  }

  delete = undefined;
}

export default new Game();
