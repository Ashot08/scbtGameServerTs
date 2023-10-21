import express from 'express';
import { check } from 'express-validator';
import AuthController from '../controllers/AuthController.ts';

export const authRouter = express.Router();

authRouter.post('/signup', [
  check('username', 'Имя пользователя не может быть пустым').notEmpty(),
  check('password', 'Пароль должен быть > 4 и < 50 символов').isLength({ min: 4, max: 50 }),
], AuthController.signup);

authRouter.post('/login', AuthController.login);

// app.get('/users', roleMiddleware(["ADMIN"]), AuthController.getUsers)
authRouter.get('/users', AuthController.getUsers);
