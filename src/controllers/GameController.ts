import { ISqlite } from 'sqlite';
import { validationResult } from 'express-validator';
import RunResult = ISqlite.RunResult;

import Game, { JoinGameOptions } from '../db/models/Game.ts';
import { getRandomNumber } from '../utils/getRandomNumber.ts';
import { getNextTurn } from '../utils/getNextTurn.ts';
import Answer from '../db/models/Answer.ts';
import Question from '../db/models/Question.ts';
import {
  getActiveDefendsCount,
  getNewActiveDefendsScheme,
  getNewNotActiveDefendsScheme,
  getNewWorkersPositionsScheme, getNextWorkerIndex, getNotActiveDefendsCount,
  getWorkersOnPositionsCount, getWorkersPositionsFirstIndex, isGamePlayersOrderCorrect,
} from '../utils/game.ts';
import {
  ANSWER_TIME_LONG, ANSWER_TIME_MIDDLE,
  ANSWER_TIME_SHORT,
  BRIGADIER_QUESTIONS_COUNT,
  MAX_WORKER_DEFENDS_COUNT,
} from '../constants/constants.ts';

export type UpdateWorkerData = {
  userId: number,
  data: { workerIndex: number, addedDefendsCount: number, workerIsSet: boolean }
}

export type BuyDefendsData = {
  userId: number,
  defendsCount: number
}

export type ChangeReadyStatusData = {
  userId: number,
  readyStatus: boolean,
}

class GameController {
  async createGame(req: any, res: any) {
    try {
      const validationErrors = validationResult(req);
      let answerTime = ANSWER_TIME_SHORT;

      if (!validationErrors.isEmpty()) {
        return res.status(400).json({ message: 'Ошибка при валидации данных', validationErrors });
      }

      if (req.body.answerTime === 40) {
        answerTime = ANSWER_TIME_MIDDLE;
      }
      if (req.body.answerTime === 60) {
        answerTime = ANSWER_TIME_LONG;
      }

      const game = {
        ...req.body,
        status: 'created',
        answersMode: 'false',
        shiftChangeMode: 'true',
        showRollResultMode: 'false',
        creationDate: new Date().toJSON(),
        brigadierStage: 'ready',
        brigadierQuestionsCount: BRIGADIER_QUESTIONS_COUNT,
        answerTime,
        playersOrder: '',
      };

      const result: RunResult = await Game.create(game);

      if (result.lastID) {
        const questionsCats = req.body.questionsCats;

        if (Array.isArray(questionsCats) && questionsCats.length) {
          for (const cat of questionsCats) {
            // eslint-disable-next-line no-await-in-loop
            await Question.addQuestionCatToGame(cat, result.lastID);
          }
        }

        return res.json({ message: 'Игра успешно создана', result });
      }
    } catch (e) {
      return res.status(400).json({ message: 'Game Creation error', e });
    }
  }

  getGames(req: any, res: any) {
    try {
      console.log('games here');
      res.json('games here res');
    } catch (e) {
      console.log(e, req);
    }
  }

  async getGame(req: any, res: any) {
    try {
      const { id } = req.params;
      const game = await Game.read({ id });

      if (game?.id) {
        return res.json({ message: 'Success Login', game });
      }
      return res.status(200).json({ message: 'Get Game error' });
    } catch (e) {
      return res.status(400).json({ message: 'Get Game error' });
    }
  }

  async getGamesByPlayerId(req: any, res: any) {
    try {
      const { playerId } = req.params;
      const games = await Game.getGamesByPlayerId(playerId);

      if (Array.isArray(games)) {
        return res.json({ message: 'Success Get Games', games });
      }
      return res.status(200).json({ message: 'Get Games error' });
    } catch (e) {
      return res.status(400).json({ message: 'Get Games error' });
    }
  }

  async joinGame(data: JoinGameOptions) {
    const {
      playerId,
      gameId,
    } = data;

    try {
      const game = await Game.read({ id: gameId });
      const players = await Game.getPlayers(gameId);

      for (const player of players) {
        if (player.player_id === playerId) {
          return { status: 'error', message: 'Игрок уже в игре' };
        }
      }

      if (game.status !== 'created') {
        return { status: 'error', message: 'Игра уже началась, к ней нельзя присоединиться' };
      }

      if (players.length >= game.players_count) {
        return { status: 'error', message: 'Все места в игре заняты' };
      }

      if (game.moderatorMode && game.moderator === playerId) {
        return { status: 'error', message: 'Игрок в режиме модератора не может участвовать' };
      }

      const result = await Game.joinGame(data);

      if (result.lastID) {
        // Если ок, добавляем игрока в players_state
        if (!game.players_order) {
          await Game.updateGamePlayersOrder(`${playerId}`, gameId);
        } else {
          await Game.updateGamePlayersOrder(`${game.players_order},${playerId}`, gameId);
        }
        await Game.createPlayerState(data.gameId, data.playerId);
        return { status: 'success', message: 'Игрок успешно добавлен в игру' };
      }
    } catch (e) {
      return { status: 'error', message: 'Игрок не добавлен в игру', e };
    }
    return { status: 'error', message: 'Игрок не добавлен в игру' };
  }

  async deletePlayerFromGame(gameId: number, playerId: number) {
    try {
      const result = await Game.deletePlayerFromGame({ gameId, playerId });
      await Game.deletePlayerState(gameId, playerId);
      console.log(result);
      return { status: 'success', message: 'deletePlayerFromGame success' };
    } catch (e) {
      return { status: 'error', message: 'deletePlayerFromGame controller error' };
    }
  }

  async deleteTurn(gameId: number, playerId: number) {
    try {
      const result = await Game.deleteTurn(gameId, playerId);
      console.log(result);
      return { status: 'success', message: 'deleteTurns success' };
    } catch (e) {
      return { status: 'error', message: 'deleteTurns controller error' };
    }
  }

  async deleteAllTurns(gameId: number) {
    try {
      const result = await Game.deleteAllTurns(gameId);
      console.log(result);
      return { status: 'success', message: 'deleteAllTurns success' };
    } catch (e) {
      return { status: 'error', message: 'deleteAllTurns controller error' };
    }
  }

  async getState(gameId: number) {
    try {
      let game = await Game.read({ id: gameId });
      const players = await Game.getPlayersByGameId({ id: gameId });
      const turns = await Game.getTurns(gameId);
      const answers = await Answer.getAnswers(gameId);
      const playersState = await Game.getPlayersStateByGameId(gameId);
      let lastTurnRolls = [];

      if (Array.isArray(turns) && turns.length) {
        const lastTurn = turns.slice(-1)[0];
        lastTurnRolls = await Game.getRolls(lastTurn.id);
      }

      if ((players.length === game.players_count) && (game.status === 'created')) {
        await Game.updateStatus('in_process', gameId);
        await Game.createTurn(gameId, players[0].id, 1);
        game = await Game.read({ id: gameId });
      }

      return {
        status: 'success',
        message: 'Состояние игры получено',
        state: {
          game,
          players,
          turns,
          answers,
          lastTurnRolls,
          playersState,
        },
      };
    } catch (e) {
      return { status: 'error', message: 'Состояние игры не получено' };
    }
  }

  async updateAnswersMode(status: 'true' | 'false', gameId: number) {
    try {
      const result = await Game.updateAnswersMode(status, gameId);
      if (result.changes) {
        return { status: 'success', message: 'game AnswersMode обновлен' };
      }
      return { status: 'error', message: 'Ошибка при обновлении game AnswersMode' };
    } catch (e) {
      return { status: 'error', message: 'Ошибка при обновлении game AnswersMode' };
    }
  }

  async updateGamePlayersOrder(order: string, gameId: number, isChangeBeforeStart = false) {
    try {
      const game = await Game.read({ id: gameId });

      if (isChangeBeforeStart) {
        const turns = await Game.getTurns(gameId);
        if (Array.isArray(turns) && turns.length) {
          const lastTurn = turns.slice(-1)[0];
          const isChangeOrderAvailable = game.shift_change_mode === 'true' && lastTurn.shift === 1;
          if (!isChangeOrderAvailable) {
            return { status: 'error', message: 'Ошибка при обновлении game  Players Order' };
          }
        }
      }

      const playersArray = await Game.getPlayersByGameId({ id: gameId });

      if (!Array.isArray(playersArray) || !playersArray.length) {
        return { status: 'error', message: 'Ошибка при обновлении game  Players Order' };
      }
      const canUpdate = isGamePlayersOrderCorrect(game, playersArray, order);
      if (canUpdate) {
        const result = await Game.updateGamePlayersOrder(order, gameId);
        if (result.changes) {
          return { status: 'success', message: 'game Players Order обновлен' };
        }
      }
      return { status: 'error', message: 'Ошибка при обновлении game  Players Order' };
    } catch (e) {
      return { status: 'error', message: 'Ошибка при обновлении game  Players Order' };
    }
  }

  async updateBrigadierStage(stage: 'ready' | 'in_process' | 'finished', gameId: number) {
    try {
      const result = await Game.updateBrigadierStage(stage, gameId);
      if (result.changes) {
        return { status: 'success', message: 'game BrigadierStage обновлен' };
      }
      return { status: 'error', message: 'Ошибка при обновлении game BrigadierStage' };
    } catch (e) {
      return { status: 'error', message: 'Ошибка при обновлении game BrigadierStage' };
    }
  }

  async createRoll(gameId: number) {
    try {
      const turns = await Game.getTurns(gameId);

      if (!Array.isArray(turns) || !turns.length) {
        return { status: 'error', message: 'Ходов пока не было' };
      }
      const lastTurn = turns.slice(-1)[0];
      const prizeNumber = getRandomNumber();

      const result = await Game.createRoll(lastTurn.id, prizeNumber);

      if (result.lastID) {
        return {
          status: 'success',
          message: 'Вращение успешно создано',
          result: { lastTurn, prizeNumber },
        };
      }
      return { status: 'error', message: 'Ошибка при создании вращения' };
    } catch (e) {
      return { status: 'error', message: 'Ошибка при создании вращения' };
    }
  }

  async createTurn(gameId: number) {
    try {
      const turns = await Game.getTurns(gameId);
      const playersArray = await Game.getPlayersByGameId({ id: gameId });
      const game = await Game.read({ id: gameId });

      if (!Array.isArray(playersArray) || !playersArray.length) {
        return { status: 'error', message: 'Ошибка создания хода 1' };
      }

      if (!isGamePlayersOrderCorrect(game, playersArray, game.players_order)) {
        return { status: 'error', message: 'Ошибка создания хода 2' };
      }
      const players = game.players_order.split(',');

      if (!Array.isArray(turns) || !Array.isArray(players) || !players.length) {
        return { status: 'error', message: 'Ошибка создания хода 3' };
      }

      const lastTurn = turns.slice(-1)[0];
      const { playerId, nextShift } = getNextTurn(lastTurn?.player_id, players, turns);

      const result = await Game.createTurn(gameId, playerId, nextShift);

      if (result.lastID) {
        return {
          status: 'success',
          message: 'Ход успешно создан',
          result: { result },
        };
      }
      return { status: 'error', message: 'Ошибка при создании хода' };
    } catch (e) {
      return { status: 'error', message: 'Ошибка при создании хода' };
    }
  }

  async createTurnOnDeletePlayer(gameId: number) {
    try {
      let turns = await Game.getTurns(gameId);
      // const players = await Game.getPlayersByGameId({ id: gameId });
      const game = await Game.read({ id: gameId });
      const playersArray = await Game.getPlayersByGameId({ id: gameId });

      if (!Array.isArray(playersArray) || !playersArray.length) {
        return { status: 'error', message: 'Ошибка создания хода' };
      }
      if (!isGamePlayersOrderCorrect(game, playersArray, game.players_order)) {
        return { status: 'error', message: 'Ошибка создания хода' };
      }
      const players = game.players_order.split(',');
      let lastTurn = 0;

      if (!Array.isArray(turns) || !turns.length) {
        turns = [];
      }

      if (!Array.isArray(players) || !players.length) {
        return { status: 'error', message: 'Ошибка создания хода' };
      }

      if (turns.length) {
        lastTurn = turns.slice(-1)[0];
      }

      const { playerId, nextShift } = getNextTurn(lastTurn, players, turns);
      const result = await Game.createTurn(gameId, playerId, nextShift);
      await Game.updateAnswersMode('false', gameId);
      await Game.updateShowRollResultMode(gameId, 'false');

      if (result.lastID) {
        return {
          status: 'success',
          message: 'Ход успешно создан',
          result: { result },
        };
      }
      return { status: 'error', message: 'Ошибка при создании хода' };
    } catch (e) {
      return { status: 'error', message: 'Ошибка при создании хода' };
    }
  }

  async finishGame(gameId: number) {
    try {
      const result = await Game.updateStatus('finished', gameId);
      if (result.changes) {
        return { status: 'success', message: 'game status обновлен' };
      }
      return { status: 'error', message: 'Ошибка при обновлении game status' };
    } catch (e) {
      return { status: 'error', message: 'Ошибка при обновлении game status' };
    }
  }

  async getPlayersStateByGameId(gameId: number) {
    const playersState = await Game.getPlayersStateByGameId(gameId);
    return playersState;
  }

  async getPlayerState(gameId: number, userId: number) {
    const playerState = await Game.getPlayerState(gameId, userId);
    return playerState;
  }

  async getBrigadierQuestionsCount(gameId: number) {
    const count = await Game.getBrigadierQuestionsCount(gameId);
    return count.brigadier_questions_count || 0;
  }

  async updateBrigadierQuestionsCount(count: number, gameId: number) {
    return Game.updateBrigadierQuestionsCount(count, gameId);
  }

  async updateWorkerData(gameId: number, data: UpdateWorkerData) {
    const userId = data.userId;
    const workerIndex = data.data.workerIndex;
    const workerIsSet = data.data.workerIsSet;
    const addedDefendsCount = data.data.addedDefendsCount;
    let workersPositionsScheme = '';
    let notActiveDefendsScheme = '';

    const playerState = await Game.getPlayerState(gameId, userId);

    if (!playerState.id) return { status: 'error', message: 'getPlayerState Ошибка' };

    if (workerIsSet) {
      workersPositionsScheme = getNewWorkersPositionsScheme(playerState, workerIndex);
      await Game.updateWorkersPositions(userId, gameId, workersPositionsScheme);
    }

    if (addedDefendsCount) {
      if (addedDefendsCount <= playerState.defends) {
        const newDefendsValue = playerState.defends - addedDefendsCount;
        notActiveDefendsScheme = getNewNotActiveDefendsScheme(
          playerState,
          workerIndex,
          addedDefendsCount,
        );
        await Game.updateWorkerNotActiveDefends(userId, gameId, notActiveDefendsScheme);
        await Game.updatePlayerDefends(userId, gameId, newDefendsValue);
      }
    }

    return { status: 'success', message: 'updateWorkerData' };
  }

  async buyDefends(gameId: number, data: BuyDefendsData) {
    const userId = data.userId;
    let newDefendsValue = data.defendsCount;
    let newMoneyValue = 0;

    const playerState = await Game.getPlayerState(gameId, userId);

    if (!playerState.id) return { status: 'error', message: 'getPlayerState Ошибка' };

    if (!newDefendsValue) return { status: 'error', message: 'defendsCount <= 0 Ошибка' };

    if (playerState.money < newDefendsValue) return { status: 'error', message: 'no money' };

    newMoneyValue = playerState.money - newDefendsValue;
    newDefendsValue += playerState.defends;

    await Game.updatePlayerDefends(userId, gameId, newDefendsValue);
    await Game.updatePlayerMoney(userId, gameId, newMoneyValue);

    return { status: 'success', message: 'buyDefends' };
  }

  async updatePlayerReadyStatus(gameId: number, data: ChangeReadyStatusData) {
    const userId = data.userId;
    const readyStatus = data.readyStatus ? 'true' : 'false';
    const result = await Game.updatePlayerReadyStatus(userId, gameId, readyStatus);

    if (result.changes) {
      return { status: 'success', message: 'updatePlayerReadyStatus' };
    }
    return { status: 'error', message: 'updatePlayerReadyStatus' };
  }

  async updatePlayerReadyToStartBrigadier(gameId: number, data: ChangeReadyStatusData) {
    const userId = data.userId;
    const readyStatus = data.readyStatus ? 'true' : 'false';
    const result = await Game.updatePlayerReadyToStartBrigadier(userId, gameId, readyStatus);

    if (result.changes) {
      return { status: 'success', message: 'updatePlayerReadyStatus' };
    }
    return { status: 'error', message: 'updatePlayerReadyStatus' };
  }

  async updatePlayerBrigadierDefendsCount(userId: number, gameId: number, newDefendsCount: number) {
    try {
      const result = await Game.updatePlayerBrigadierDefendsCount(userId, gameId, newDefendsCount);
      if (result.changes) {
        return { status: 'success', message: 'updatePlayerBrigadierDefendsCount' };
      }
      return { status: 'error', message: 'updatePlayerBrigadierDefendsCount' };
    } catch (e) {
      return { status: 'error', message: 'updatePlayerBrigadierDefendsCount' };
    }
  }

  async updateShiftChangeMode(gameId: number, shiftChangeMode: 'true' | 'false') {
    if (shiftChangeMode !== 'true' && shiftChangeMode !== 'false') {
      return { status: 'error', message: 'shiftChangeMode incorrect data' };
    }
    const result = await Game.updateShiftChangeMode(gameId, shiftChangeMode);
    if (result.changes) {
      return { status: 'success', message: 'updateShiftChangeMode' };
    }
    return { status: 'error', message: 'updateShiftChangeMode' };
  }

  async updateShowRollResultMode(gameId: number, showRollResultMode: 'true' | 'false') {
    if (showRollResultMode !== 'true' && showRollResultMode !== 'false') {
      return { status: 'error', message: 'shiftChangeMode incorrect data' };
    }
    const result = await Game.updateShowRollResultMode(gameId, showRollResultMode);
    if (result.changes) {
      return { status: 'success', message: 'updateShowRollResultMode' };
    }
    return { status: 'error', message: 'updateShowRollResultMode' };
  }

  async paySalaryAndUpdateNoMoreRolls(gameId: number) {
    const playersState = await Game.getPlayersStateByGameId(gameId);
    for (const p of playersState) {
      const workersOnPositionsCount = getWorkersOnPositionsCount(p);
      const newMoneyValue = p.money + workersOnPositionsCount;
      /* eslint-disable */
      await Game.updatePlayerMoney(p.player_id, gameId, newMoneyValue);
      await Game.updateNoMoreRolls(p.player_id, gameId, 'false');
    }
    return {status: 'success', message: 'paySalary'};
  }

  async setActualActiveWorker(gameId: number, playerState: any) {
    let activeWorker = getWorkersPositionsFirstIndex(playerState);
    const result = await Game.updatePlayerActiveWorker(playerState.player_id, gameId, activeWorker);
    if(result.changes) {
      return {status: 'success', message: 'setActualActiveWorker'};
    }
    return {status: 'error', message: 'setActualActiveWorker'};
  }

  async setActualNextWorker(gameId: number, playerState: any) {
    let activeWorkerIndex = getWorkersPositionsFirstIndex(playerState);
    let nextWorker = getNextWorkerIndex(playerState, activeWorkerIndex);
    const result = await Game.updatePlayerNextWorkerIndex(playerState.player_id, gameId, nextWorker);
    if(result.changes) {
      return {status: 'success', message: 'setActualNextWorker'};
    }
    return {status: 'error', message: 'setActualNextWorker'};
  }

  async onRollBonus(gameId: number, playerState: any) {
    await Game.updateAccidentDiff(playerState.player_id, gameId, 0);
    await Game.updateQuestionsToActivateDef(playerState.player_id, gameId, 0);
    await Game.updateQuestionsWithoutDef(playerState.player_id, gameId, 0);

    // const notActiveDefendsCount = getNotActiveDefendsCount(playerState, playerState.active_worker);
    // const activeDefendsCount = getActiveDefendsCount(playerState, playerState.active_worker);
    // const totalDefendsCount = notActiveDefendsCount + activeDefendsCount;
    // if((notActiveDefendsCount > 0) && (totalDefendsCount >= 6)) {
    //   await this.updateNotActiveDefends(
    //     gameId, playerState, -1,
    //   );
    // }
    // await this.updateActiveDefends(
    //   gameId, playerState, 1,
    // );

    await this.addActiveDefend(gameId, playerState, playerState.active_worker);
    return {status: 'success', message: 'onRollBonus'};
  }

  async onAccident(gameId: number, playerState: any) {
    if(playerState.questions_to_active_def_count > 0) {
      await Game.updateQuestionsToActivateDef(
        playerState.player_id,
        gameId,
        playerState.questions_to_active_def_count - 1
      )
    } else if (playerState.questions_without_def_count > 0) {
      await Game.updateQuestionsWithoutDef(
        playerState.player_id,
        gameId,
        playerState.questions_without_def_count - 1
      );
    } else if (playerState.next_worker_mode === 'true') {

    }
    return {status: 'success', message: 'onAccident'};
  }

  async goNextWorker(gameId: number, playerState: any) {
    // await Game.updateQuestionsToActivateDef(playerState.player_id, gameId, 0);
    // await Game.updateQuestionsWithoutDef(playerState.player_id, gameId, 0);
    // Переход к следующему рабочему
    let activeWorkerIndex = playerState.active_worker;
    let nextWorker = getNextWorkerIndex(playerState, activeWorkerIndex);
    if(!nextWorker || (nextWorker < activeWorkerIndex)) {
      await Game.updateNoMoreRolls(playerState.player_id, gameId, 'true');
    } else {
      await Game.updatePlayerActiveWorker(playerState.player_id, gameId, nextWorker);
      nextWorker = getNextWorkerIndex(playerState, nextWorker);
      await Game.updatePlayerNextWorkerIndex(playerState.player_id, gameId, nextWorker);
    }
    return {status: 'success', message: 'onNextWorker'};
  }

  async applyPunishment(gameId: number, playerState: any) {
    switch (playerState.accident_difficultly) {
      case 1:
      case 2:
        if(playerState.money > 0)
        await Game.updatePlayerMoney(playerState.player_id, gameId, playerState.money - 1);
        break;
      default:
        if(playerState.money > 0) {
          await Game.updatePlayerMoney(playerState.player_id, gameId, playerState.money - 1);
        }
        const newWorkersScheme = getNewWorkersPositionsScheme(playerState, playerState.active_worker, true);
        await Game.updateWorkersPositions(playerState.player_id, gameId, newWorkersScheme);
        if(playerState.workers_alive > 0) {
          await Game.updatePlayerWorkersAliveCount(
            playerState.player_id,
            gameId,
            playerState.workers_alive - 1
          );
        }
        break;
    }
    return {status: 'success', message: 'applyPunishment'};
  }

  async applyNextWorkerPunishment(gameId: number, playerState: any) {
    if (playerState.money > 0) {
      await Game.updatePlayerMoney(playerState.player_id, gameId, playerState.money - 1);
    }
    return {status: 'success', message: 'applyPunishment'};
  }

  async updateNotActiveDefends(gameId: number, playerState: any, addingCount: number){
    const notActiveDefendsScheme = getNewNotActiveDefendsScheme(
      playerState,
      playerState.active_worker,
      addingCount,
    );
    await Game.updateWorkerNotActiveDefends(playerState.player_id, gameId, notActiveDefendsScheme);
  }

  async updateActiveDefends(gameId: number, playerState: any, addingCount: number){
    const activeDefendsScheme = getNewActiveDefendsScheme(
      playerState,
      playerState.active_worker,
      addingCount,
    );
    await Game.updateWorkerActiveDefends(playerState.player_id, gameId, activeDefendsScheme);
  }

  async addActiveDefend(gameId: number, playerState: any, workerIndex: number){

    const activeDefendsCount = getActiveDefendsCount(playerState, workerIndex);
    const notActiveDefendsCount = getNotActiveDefendsCount(playerState, workerIndex);

    if(activeDefendsCount >= MAX_WORKER_DEFENDS_COUNT){
      return;
    }

    if((activeDefendsCount + notActiveDefendsCount) >= MAX_WORKER_DEFENDS_COUNT){
      const notActiveDefendsScheme = getNewNotActiveDefendsScheme(
        playerState,
        workerIndex,
        -1,
      );
      await Game.updateWorkerNotActiveDefends(playerState.player_id, gameId, notActiveDefendsScheme);
    }

    const activeDefendsScheme = getNewActiveDefendsScheme(
      playerState,
      workerIndex,
      1,
    );
    await Game.updateWorkerActiveDefends(playerState.player_id, gameId, activeDefendsScheme);
  }

  async updatePlayerNextWorkerIndex(gameId: number, playerState: any){
    const nextWorkerIndex = getNextWorkerIndex(
      playerState,
      playerState.active_worker,
    );
    await Game.updatePlayerNextWorkerIndex(playerState.player_id, gameId, nextWorkerIndex);
  }
  async updatePlayerNextWorkerMode(gameId: number, playerId: number, nextWorkerMode: string){
    await Game.updatePlayerNextWorkerMode(playerId, gameId, nextWorkerMode);
  }
  async updateNextWorkerQuestionsCount(gameId: number, playerId: number, newQuestionsCount: number){
    await Game.updateNextWorkerQuestionsCount(playerId, gameId, newQuestionsCount);
  }

  async updateQuestionsToActivateDef(userId: number, gameId: number, questionsToActivateDefCount: number) {
    if(questionsToActivateDefCount < 0) {
      questionsToActivateDefCount = 0;
    }
    await Game.updateQuestionsToActivateDef(userId, gameId, questionsToActivateDefCount);
  }

  async updateQuestionsWithoutDef(userId: number, gameId: number, questionsWithoutDefCount: number) {
    if(questionsWithoutDefCount < 0) {
      questionsWithoutDefCount = 0;
    }
    await Game.updateQuestionsWithoutDef(userId, gameId, questionsWithoutDefCount);
  }

  async updatePlayersCount(gameId: number){
    const players = await Game.getPlayersByGameId({id: gameId});
    if (Array.isArray(players) && players.length) {
      await Game.updatePlayersCount(players.length, gameId);
      return {status: 'success'}
    } else {
      return {status: 'error'}
    }
  }
}

export default new GameController();
