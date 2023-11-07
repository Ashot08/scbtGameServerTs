import { ISqlite } from 'sqlite';
import { validationResult } from 'express-validator';
import RunResult = ISqlite.RunResult;

import Game from '../db/models/Game.ts';

interface GameState {
  gameInfo: any,
  players: any,
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
        creationDate: new Date().toJSON(),
      };

      const result: RunResult = await Game.create(game);

      if (!result.lastID) {
        return res.status(400).json({ message: 'Game Creation error' });
      }

      const joinPlayerResult = await Game.joinPlayer({
        gameId: result.lastID, playerId: req.body.moderator,
      });

      if (!joinPlayerResult.lastID) {
        return res.status(400).json({ message: 'Join Player error' });
      }

      return res.json({ message: 'Игра успешно создана', result });
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
        return res.json({ message: 'Success Get Game', game });
      }
      return res.status(200).json({ message: 'Get Game error' });
    } catch (e) {
      return res.status(400).json({ message: 'Get Game error' });
    }
  }

  async getGameState(gameId: number) {
    try {
      const gameState: GameState = {
        gameInfo: undefined,
        players: [],
      };
      const game = await Game.read({ id: gameId });
      const players = await Game.getPlayersByGameId({ id: gameId });

      gameState.gameInfo = game;

      if (Array.isArray(players)) {
        gameState.players = players;
      }

      console.log(players);

      if (game?.id) {
        return { message: 'Success Get Game State', gameState };
      }
      return { message: 'Get Game State error' };
    } catch (e) {
      return { message: 'Get Game State error', e: JSON.stringify(e) };
    }
  }

  async joinPlayerToGame(gameId: number, playerId: number) {
    const game = await Game.read({ id: gameId });
    const players = await Game.getPlayersByGameId({ id: gameId });

    if (players.length >= game.players_count) {
      return { message: 'Все игроки набраны' };
    }

    if (game.status === 'finished') {
      return { message: 'Игра уже завершена' };
    }

    if (game.status === 'in_process') {
      return { message: 'Игра уже началась' };
    }

    const joinPlayerResult = await Game.joinPlayer({
      gameId, playerId,
    });

    if (joinPlayerResult.lastID) {
      return { message: 'Игрок успешно добавлен в игру', lastID: joinPlayerResult.lastID };
    }

    return { message: 'Ошибка, игрок не добавлен' };
  }
}

export default new GameController();
