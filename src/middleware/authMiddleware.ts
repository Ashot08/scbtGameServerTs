import jwt from 'jsonwebtoken';
import config from '../../config.ts';

export default (req: any, res: any, next: any) => {
  if (req.method === 'OPTIONS') {
    next();
  }
  try {
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
      return res.status(403).json({ message: 'Пользователь не авторизован' });
    }

    req.user = jwt.verify(token, config.secret);
    next();
  } catch (e) {
    return res.status(403).json({ message: 'Ошибка авторизации' });
  }
};
