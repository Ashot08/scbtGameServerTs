import jwt from 'jsonwebtoken';
import config from '../../config.ts';
import { UserType } from '../db/models/User.ts';

interface JwtPayload {
  type: string;
}

export const userTypeMiddleware = (accessedTypes: UserType[]) => async (req: any, res: any, next: any) => {
  if (req.method === 'OPTIONS') {
    next();
  }
  try {
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
      return res.status(403).json({ message: 'Пользователь не авторизован' });
    }

    const { type } = jwt.verify(token, config.secret) as JwtPayload;

    let hasAccess = false;
    if (accessedTypes.includes(type as UserType)) {
      hasAccess = true;
    }
    if (!hasAccess) {
      return res.status(403).json({ message: 'У вас нет доступа' });
    }
    next();
  } catch (e) {
    return res.status(403).json({ message: 'Ошибка доступа' });
  }
};
