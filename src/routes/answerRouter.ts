import express from 'express';
import { check } from 'express-validator';
import AuthMiddleware from '../middleware/authMiddleware.ts';
import AnswerController from '../controllers/AnswerController.ts';

export const answerRouter = express.Router();

answerRouter.post('/create_temp_answer', [
  check('answerId', 'answerId не может быть пустым').notEmpty(),
  check('answerId', 'answerId должно быть isNumeric').isNumeric(),
  check('gameId', 'gameId не может быть пустым').notEmpty(),
  check('gameId', 'gameId должно быть isNumeric').isNumeric(),
  check('playerId', 'playerId не может быть пустым').notEmpty(),
  check('playerId', 'playerId должно быть isNumeric').isNumeric(),
  check('questionId', 'questionId не может быть пустым').notEmpty(),
  check('questionId', 'questionId должно быть isNumeric').isNumeric(),
  check('variantId', 'variantId не может быть пустым').notEmpty(),
  check('variantId', 'variantId должно быть isNumeric').isNumeric(),
], AuthMiddleware, AnswerController.createTempAnswer);

answerRouter.get('/temp_answers', [
  check('gameId', 'gameId не может быть пустым').notEmpty(),
  check('gameId', 'gameId должно быть Numeric').isNumeric(),
  // check('offset', 'Отступ не может быть пустым').notEmpty(),
  // check('filters', 'Фильтр не может быть пустым').notEmpty(),
], AuthMiddleware, AnswerController.getTempAnswersByGameId);
