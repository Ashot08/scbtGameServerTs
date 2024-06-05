import express from 'express';
import { check } from 'express-validator';
import AuthController from '../controllers/AuthController.ts';
import AuthMiddleware from '../middleware/authMiddleware.ts';
import { userTypeMiddleware } from '../middleware/userTypeMiddleware.ts';
import { UserType } from '../db/models/User.ts';

export const authRouter = express.Router();

authRouter.post('/signup', [
  check('username', 'Имя пользователя не может быть пустым').notEmpty(),
  check('password', 'Пароль должен быть > 4 и < 50 символов').isLength({ min: 4, max: 50 }),
], AuthController.signup);

authRouter.post('/image', [], AuthController.signup);

authRouter.post('/login', AuthController.login);

// app.get('/users', roleMiddleware(["ADMIN"]), AuthController.getUsers)
authRouter.get('/users', AuthMiddleware, userTypeMiddleware([UserType.Admin]), AuthController.getUsers);
authRouter.get('/user/:id', AuthMiddleware, AuthController.getUser);
