import jwt from 'jsonwebtoken';
import { ISqlite } from 'sqlite';
import { validationResult } from 'express-validator';
import RunResult = ISqlite.RunResult;
import config from '../../config.ts';
import User from '../db/models/User.ts';
import bcrypt from 'bcrypt';

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
      const user = await User.read({username});
      if(!user){
        return res.status(400).json({ message: `Ошибка в имени пользователя или пароле 1` });
      }
      const isValidPassword = bcrypt.compareSync(password, user.password);

      if(!isValidPassword){
        return res.status(400).json({ message: `Ошибка в имени пользователя или пароле` });
      }

      const token = generateAccessToken(user.id);
      return res.json({ message: 'Пользователь успешно залогинен', token });
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
        return res.json({ message: 'Пользователь уже существует' });
      }

      const hashPassword = bcrypt.hashSync(password, 5);
      const user = {...req.body, password: hashPassword};

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
}

export default new AuthController();
