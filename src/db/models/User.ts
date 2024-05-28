import { ISqlite } from 'sqlite';
import BaseModel from './BaseModel.ts';
import db from '../index.ts';
import RunResult = ISqlite.RunResult;

export interface SignUpData {
  name: string;
  username: string;
  email: string;
  password: string;
}
export interface ReadOptions {
  ids?: Array <number>,
  username?: string,
  email?: string,
  id?: number,
}

export enum UserType {
  Base = 'base',
  Company = 'company',
  Admin = 'admin',
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
    return db.run(
      'INSERT INTO users (name, username, email, password, type) VALUES (?, ?, ?, ?, ?)',
      [name, username, email, password, UserType.Base],
    );
  }

  update = undefined;

  async read(options: ReadOptions) {
    if (options.hasOwnProperty('username')) {
      return db.get('SELECT * FROM users WHERE username = ?', options.username);
    }
    if (options.hasOwnProperty('id')) {
      return db.get('SELECT * FROM users WHERE id = ?', options.id);
    }
    return db.all(
      'SELECT * FROM users',
    );
  }

  delete = undefined;
}

export default new User();
