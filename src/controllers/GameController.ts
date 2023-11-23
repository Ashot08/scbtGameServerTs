import { ISqlite } from 'sqlite';
import { validationResult } from 'express-validator';
import RunResult = ISqlite.RunResult;

import Game, { JoinGameOptions } from '../db/models/Game.ts';
import { getRandomNumber } from '../utils/getRandomNumber.ts';
import { getNextTurn } from '../utils/getNextTurn.ts';

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
        creationDate: new Date().toJSON(),
      };

      const result: RunResult = await Game.create(game);

      if (result.lastID) {
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
      const answers = await Game.getAnswers(gameId);
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
        },
      };
    } catch (e) {
      return { status: 'error', message: 'Состояние игры не получено' };
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

  async createAnswers(gameId: number) {
    try {
      const turns = await Game.getTurns(gameId);
      const players = await Game.getPlayersByGameId({ id: gameId });

      if (!Array.isArray(turns) || !Array.isArray(players) || !players.length || !turns.length) {
        return { status: 'error', message: 'Ошибка создания ответов' };
      }
      const lastTurn = turns.slice(-1)[0];

      const rolls = await Game.getRolls(lastTurn.id);

      if (!Array.isArray(rolls) || !rolls.length) {
        return { status: 'error', message: 'Ошибка создания ответов' };
      }

      const lastRoll = rolls.slice(-1)[0];

      const questionNumber = Math.floor(Math.random() * 180);

      let result = null;

      for (const player of players) {
        const isCountable: 'true' | 'false' = (player.id === lastTurn.player_id) ? 'false' : 'true';

        // eslint-disable-next-line no-await-in-loop
        result = await Game.createAnswer({
          turnId: lastTurn.id,
          gameId,
          playerId: player.id,
          rollId: lastRoll.id,
          questionId: questionNumber,
          isCountable,
          status: 'in_process',
        });
      }

      if (result?.lastID) {
        return {
          status: 'success',
          message: 'Ответы успешно созданы',
          result: { result },
        };
      }
      return { status: 'error', message: 'Ошибка при создании ответов' };
    } catch (e) {
      return { status: 'error', message: 'Ошибка при создании ответов' };
    }
  }

  async updateAnswerStatus(status: 'error' | 'success' | 'in_process', answerId: number) {
    try {
      const result = await Game.updateAnswerStatus(status, answerId);
      if (result) {
        return { status: 'success', message: 'Ответ обновлен' };
      }
      return { status: 'error', message: 'Ошибка при обновлении ответа' };
    } catch (e) {
      return { status: 'error', message: 'Ошибка при обновлении ответа' };
    }
  }

  async updateAnswersMode(status: 'true' | 'false', gameId: number) {
    try {
      const result = await Game.updateAnswersMode(status, gameId);
      if (result) {
        return { status: 'success', message: 'game AnswersMode обновлен' };
      }
      return { status: 'error', message: 'Ошибка при обновлении game AnswersMode' };
    } catch (e) {
      return { status: 'error', message: 'Ошибка при обновлении game AnswersMode' };
    }
  }

  async updateExpiredAnswerStatus(status: 'success' | 'error', gameId: number) {
    try {
      const result = await Game.updateExpiredAnswerStatus(status, gameId);

      if(result) {
        return { status: 'success', message: 'Успех при обновлении ExpiredAnswerStatus' };
      }
      return { status: 'error', message: 'Ошибка при обновлении ExpiredAnswerStatus' };

    } catch(e){
      return { status: 'error', message: 'Ошибка при обновлении ExpiredAnswerStatus' };
    }
  }

}

export default new GameController();
