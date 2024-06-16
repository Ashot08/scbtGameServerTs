import express from 'express';
import { check } from 'express-validator';
import AuthMiddleware from '../middleware/authMiddleware.ts';
import QuestionController from '../controllers/QuestionController.ts';
import { userTypeMiddleware } from '../middleware/userTypeMiddleware.ts';
import { UserType } from '../db/models/User.ts';

export const questionRouter = express.Router();

questionRouter.post('/create_cat', [
  check('title', 'Название Категории вопроса не может быть пустым').notEmpty(),
  check('slug', 'Slug не указано').notEmpty(),
], AuthMiddleware, QuestionController.createQuestionCat);

questionRouter.post('/delete_cats', [
  check('catsIds', 'Категории не может быть пустым').notEmpty(),
], AuthMiddleware, QuestionController.deleteQuestionCats);

questionRouter.post('/create_question', [
  check('text', 'Текст вопроса не может быть пустым').notEmpty(),
  check('type', 'Тип вопроса не может быть пустым').notEmpty(),
  check('difficulty', 'Сложность вопроса не может быть пустым').notEmpty(),
], AuthMiddleware, userTypeMiddleware([UserType.Admin]), QuestionController.createQuestion);

questionRouter.get('/questions', [
  // check('count', 'Количество не может быть пустым').notEmpty(),
  // check('offset', 'Отступ не может быть пустым').notEmpty(),
  // check('filters', 'Фильтр не может быть пустым').notEmpty(),
], AuthMiddleware, userTypeMiddleware([UserType.Admin]), QuestionController.getQuestions);

questionRouter.get('/question', [
  check('id', 'Id не может быть пустым').notEmpty(),
  check('id', 'Id должно быть числом').isNumeric(),
], AuthMiddleware, userTypeMiddleware([UserType.Admin]), QuestionController.getQuestionById);

// questionRouter.get('/games/:playerId', AuthMiddleware, GameController.getGamesByPlayerId);
questionRouter.get('/cats', AuthMiddleware, QuestionController.getQuestionCats);
questionRouter.get('/cats/:gameId', AuthMiddleware, QuestionController.getQuestionCatsByGameId);
