import { ISqlite } from 'sqlite';
import { validationResult } from 'express-validator';
import RunResult = ISqlite.RunResult;

import Game, { JoinGameOptions } from '../db/models/Game.ts';
import { getRandomNumber } from '../utils/getRandomNumber.ts';
import { getNextTurn } from '../utils/getNextTurn.ts';
import Answer from '../db/models/Answer.ts';
import Question from '../db/models/Question.ts';
import {
  getNewNotActiveDefendsScheme,
  getNewWorkersPositionsScheme, getNextWorkerIndex,
  getWorkersOnPositionsCount, getWorkersPositionsFirstIndex,
} from '../utils/game.ts';

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

      if (!validationErrors.isEmpty()) {
        return res.status(400).json({ message: 'Ошибка при валидации данных', validationErrors });
      }

      const game = {
        ...req.body,
        status: 'created',
        answersMode: 'false',
        shiftChangeMode: 'true',
        creationDate: new Date().toJSON(),
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
        await Game.createPlayerState(data.gameId, data.playerId);

        return { status: 'success', message: 'Игрок успешно добавлен в игру' };
      }
    } catch (e) {
      return { status: 'error', message: 'Игрок не добавлен в игру', e };
    }
    return { status: 'error', message: 'Игрок не добавлен в игру' };
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
      const players = await Game.getPlayersByGameId({ id: gameId });

      if (!Array.isArray(turns) || !Array.isArray(players) || !players.length || !turns.length) {
        return { status: 'error', message: 'Ошибка создания хода' };
      }
      const lastTurn = turns.slice(-1)[0];

      const { playerId, nextShift } = getNextTurn(lastTurn.player_id, players, turns);

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
    await Game.updatePlayerDefends(playerState.player_id, gameId, playerState.defends + 1);

    let activeWorkerIndex = playerState.active_worker;
    let nextWorker = getNextWorkerIndex(playerState, activeWorkerIndex);
    if(!nextWorker || (nextWorker < activeWorkerIndex)) {
      await Game.updateNoMoreRolls(playerState.player_id, gameId, 'true');
    } else {
      await Game.updatePlayerActiveWorker(playerState.player_id, gameId, nextWorker);
      nextWorker = getNextWorkerIndex(playerState, nextWorker);
      await Game.updatePlayerNextWorkerIndex(playerState.player_id, gameId, nextWorker);
    }

    return {status: 'success', message: 'onRollBonus'};
  }

  async onRollMicro(gameId: number, playerState: any) {
    await Game.updateAccidentDiff(playerState.player_id, gameId, 1);

    // await Game.updateQuestionsToActivateDef(playerState.player_id, gameId, 0);
    // await Game.updateQuestionsWithoutDef(playerState.player_id, gameId, 0);
    // await Game.updatePlayerDefends(playerState.player_id, gameId, playerState.defends + 1);
    //
    // let activeWorkerIndex = playerState.active_worker;
    // let nextWorker = getNextWorkerIndex(playerState, activeWorkerIndex);
    // if(!nextWorker || (nextWorker < activeWorkerIndex)) {
    //   await Game.updateNoMoreRolls(playerState.player_id, gameId, 'true');
    // } else {
    //   await Game.updatePlayerActiveWorker(playerState.player_id, gameId, nextWorker);
    //   nextWorker = getNextWorkerIndex(playerState, nextWorker);
    //   await Game.updatePlayerNextWorkerIndex(playerState.player_id, gameId, nextWorker);
    // }

    return {status: 'success', message: 'onRollMicro'};
  }
}

export default new GameController();
