class AuthController {
  login(req: any, res: any) {
    try {
      console.log('try login', res);
    } catch (e) {
      console.log(e, req);
    }
  }

  signup(req: any, res: any) {
    try {
      console.log('try signup', res);
    } catch (e) {
      console.log(e, req);
    }
  }

  getUsers(req: any, res: any) {
    try {
      console.log('users here');
      res.json('users here res')
    } catch (e) {
      console.log(e, req);
    }
  }
}

export default new AuthController();
