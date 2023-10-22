import User from '../db/models/User.ts';
import {ISqlite} from "sqlite";
import RunResult = ISqlite.RunResult;
import {validationResult} from "express-validator";
import jwt from 'jsonwebtoken';
import config from '../../config.ts'

function generateAccessToken(id: number){
  const payload = {
    id
  };
  return jwt.sign(payload, config.secret, {expiresIn: "24h"});
}

class AuthController {
  login(req: any, res: any) {
    try {
      console.log('try login', res);
    } catch (e) {
      console.log(e, req);
    }
  }

  async signup(req: any, res: any) {
    try {
      const validationErrors = validationResult(req);

      if(!validationErrors.isEmpty()){
        return res.status(400).json({message: "Ошибка при валидации данных", validationErrors})
      }

      const {username} = req.body;
      const alreadyExistUser = await User.read({username});

      if(alreadyExistUser?.id){
        return res.json({ message: 'Пользователь уже существует' });
      }

      const result: RunResult = await User.create(req.body);

      if(result.lastID) {
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
