import BaseModel from "./BaseModel.ts";
import db from "../index.ts";

export interface SignUpData {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface LogInData {
  username: string;
  password: string;
}
class User extends BaseModel{
  constructor() {
    super();
  }
  async create(data: SignUpData): Promise<unknown> {
    try {
      console.log(data);
      const result = await db.run(
        `INSERT INTO users (name, username, email, password) VALUES ('1one', '1two', '1three', '1four')`,

      );
      return result;
    } catch (e) {
      return e;
    }
  }

  update = undefined;

  read = undefined;

  delete = undefined;

}

export default new User();
