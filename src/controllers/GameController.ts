import { ISqlite } from 'sqlite';
import { validationResult } from 'express-validator';
import RunResult = ISqlite.RunResult;

import Game, {JoinGameOptions} from '../db/models/Game.ts';

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

    const game = await Game.read({ id: gameId });
    const players = await Game.getPlayers(gameId);

    if(game.status !== 'created') {
      return {status: 'error', message: 'Игру уже началась, к ней нельзя присоединиться'}
    }

    if(players.length >= game.playersCount ) {
      return {status: 'error', message: 'Все места в игре заняты'}
    }

    if(game.moderatorMode && game.moderator === playerId) {
      return {status: 'error', message: 'Игрок находится в режиме модератора, он не может принимать участие в игре'}
    }

    const result = await Game.joinGame(data);

    if(result.lastID) {
      return {status: 'success', message: 'Игрок успешно добавлен в игру'}
    }

    return {status: 'error', message: 'Игрок не добавлен в игру'}

  }

  async getState(gameId: number) {
    const game = await Game.read({ id: gameId });
    const players = await Game.getPlayers(gameId);
    const turns = await Game.getTurns(gameId);
    const rolls = await Game.getTurns(gameId);

    return {game};
  }
}

export default new GameController();
