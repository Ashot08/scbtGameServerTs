import express from 'express';
import { check } from 'express-validator';
import AuthMiddleware from '../middleware/authMiddleware.ts';
import QuestionController from '../controllers/QuestionController.ts';

export const questionRouter = express.Router();

questionRouter.post('/create_cat', [
  check('title', 'Название Категории вопроса не может быть пустым').notEmpty(),
  check('slug', 'Slug не указано').notEmpty(),
], AuthMiddleware, QuestionController.createQuestionCat);

questionRouter.post('/delete_cats', [
  check('catsIds', 'Категории не может быть пустым').notEmpty(),
], AuthMiddleware, QuestionController.deleteQuestionCats);

// questionRouter.get('/games/:playerId', AuthMiddleware, GameController.getGamesByPlayerId);
questionRouter.get('/cats', AuthMiddleware, QuestionController.getQuestionCats);
questionRouter.get('/cats/:gameId', AuthMiddleware, QuestionController.getQuestionCatsByGameId);
