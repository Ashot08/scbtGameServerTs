import User from "../db/models/User.ts";

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
      // const {username, password} = req.body;
      const result = await User.create(req.body);
      console.log('try signup', req.body);
      console.log('try signup', result);
      res.json({ message: 'Пользователь успешно зарегистрирован' });
    } catch (e) {
      console.log(e, req.body);
      res.status(400).json({ message: 'Registration error' });
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
