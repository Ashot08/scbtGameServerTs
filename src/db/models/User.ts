import BaseModel from './BaseModel.ts';
import db from '../index.ts';
import {ISqlite} from "sqlite";
import RunResult = ISqlite.RunResult;

export interface SignUpData {
  name: string;
  username: string;
  email: string;
  password: string;
}
export interface ReadOptions {
  ids?: Array <number>;
  username?: string,
  email?: string,
}

export interface LogInData {
  username: string;
  password: string;
}
class User extends BaseModel {
  async create(data: SignUpData): Promise<RunResult> {

    const {
      name, username, email, password,
    } = data;
    return await db.run(
      'INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)',
      [name, username, email, password],
    );

  }

  update = undefined;

  async read (options: ReadOptions) {
    if(options.hasOwnProperty('username' )){
      return await db.get(
        'SELECT * FROM users WHERE username = ?', options.username
      );
    }
    return await db.all(
      'SELECT * FROM users'
    );
  };

  delete = undefined;
}

export default new User();
