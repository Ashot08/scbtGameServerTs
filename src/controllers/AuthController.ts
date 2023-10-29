import jwt from 'jsonwebtoken';
import { ISqlite } from 'sqlite';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import RunResult = ISqlite.RunResult;
import config from '../../config.ts';
import User from '../db/models/User.ts';

function generateAccessToken(id: number) {
  const payload = {
    id,
  };
  return jwt.sign(payload, config.secret, { expiresIn: '24h' });
}

class AuthController {
  async login(req: any, res: any) {
    try {
      const { username, password } = req.body;
      const user = await User.read({ username });
      if (!user) {
        return res.status(400).json({ message: 'Ошибка в имени пользователя или пароле' });
      }
      const isValidPassword = bcrypt.compareSync(password, user.password);

      if (!isValidPassword) {
        return res.status(400).json({ message: 'Ошибка в имени пользователя или пароле' });
      }

      const token = generateAccessToken(user.id);
      return res.json({
        message: 'Пользователь успешно залогинен',
        token,
        username: user.username,
        email: user.email,
        id: user.id,
      });
    } catch (e) {
      return res.status(400).json({ message: 'Login error' });
    }
  }

  async signup(req: any, res: any) {
    try {
      const validationErrors = validationResult(req);

      if (!validationErrors.isEmpty()) {
        return res.status(400).json({ message: 'Ошибка при валидации данных', validationErrors });
      }

      const { username, password } = req.body;
      const alreadyExistUser = await User.read({ username });

      if (alreadyExistUser?.id) {
        return res.json({
          message: `Пользователь с логином "${username}" уже существует`,
          status: 'error',
        });
      }

      const hashPassword = bcrypt.hashSync(password, 5);
      const user = { ...req.body, password: hashPassword };

      const result: RunResult = await User.create(user);

      if (result.lastID) {
        const token = generateAccessToken(result.lastID);
        return res.json({ message: 'Пользователь успешно зарегистрирован', result, token });
      }
    } catch (e) {
      return res.status(400).json({ message: 'Registration error' });
    }
  }

  getUsers(req: any, res: any) {
    try {
      console.log('users here');
      res.json('users here res');
    } catch (e) {
      console.log(e, req);
    }
  }

  async getUser(req: any, res: any) {
    try {
      const { id } = req.params;
      const user = await User.read({ id });

      if (user?.id) {
        return res.json({ message: 'Success Login', user });
      }
      return res.status(200).json({ message: 'Get User error' });
    } catch (e) {
      return res.status(400).json({ message: 'Get User error' });
    }
  }
}

export default new AuthController();
