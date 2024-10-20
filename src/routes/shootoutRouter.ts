import express from 'express';
import { check } from 'express-validator';
import AuthMiddleware from '../middleware/authMiddleware.ts';
import ShootoutController from "../controllers/ShootoutController.ts";

export const shootoutRouter = express.Router();

shootoutRouter.post('/create', [
  check('players', 'players не может быть пустым').notEmpty(),
  check('players', 'players должно быть isString').isString(),
  check('gameId', 'gameId не может быть пустым').notEmpty(),
  check('gameId', 'gameId должно быть isNumeric').isNumeric(),
], AuthMiddleware, ShootoutController.createShootout);

// shootoutRouter.get('/shootout_by_game_id', [
//   check('gameId', 'gameId не может быть пустым').notEmpty(),
//   check('gameId', 'gameId должно быть Numeric').isNumeric(),
// ], AuthMiddleware, ShootoutController.getShootoutByGameId);
