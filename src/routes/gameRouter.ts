import express from 'express';
import { check } from 'express-validator';
import GameController from '../controllers/GameController.ts';
import AuthMiddleware from '../middleware/authMiddleware.ts';

export const gameRouter = express.Router();

gameRouter.post('/create', [
  check('title', 'Название игры не может быть пустым').notEmpty(),
  check('playersCount', 'Количество игроков не указано').notEmpty(),
  check('moderator', 'Не указан модератор').notEmpty(),
], AuthMiddleware, GameController.createGame);

gameRouter.get('/games/:playerId', AuthMiddleware, GameController.getGamesByPlayerId);
gameRouter.get('/game/:id', AuthMiddleware, GameController.getGame);
