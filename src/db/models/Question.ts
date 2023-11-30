import BaseModel from './BaseModel.ts';
import db from '../index.ts';

export interface QuestionCatReadOptions {
  id?: number,
}

export interface QuestionCatOptions {
  title: string,
  slug: string,
}
class Question extends BaseModel {
  async getQuestionCats() {
    return db.all(`SELECT * FROM questionCats 
        ORDER BY id ASC`);
  }

  async getQuestionCatsByGameId(gameId: number) {
    return db.all(
      `SELECT c.id, c.title, c.slug 
        FROM games_questionsCats as gc
        JOIN questionCats as c ON c.id = gc.questionCat_id
        WHERE gc.game_id = ? ORDER BY c.id ASC`,
      gameId,
    );
  }

  async createQuestionCat(options: QuestionCatOptions) {
    const {
      title,
      slug,
    } = options;
    return db.run(
      `INSERT INTO 
            questionCats (title, slug) 
            VALUES (?, ?)
      `,
      [title, slug],
    );
  }

  async addQuestionCatsToGame(catsIds: number[], gameId: number) {
    let sql = '';

    for (const id of catsIds) {
      sql += `INSERT OR ROLLBACK 
            INTO games_questionsCats 
            (game_id, questionCat_id) 
            VALUES (${gameId}, ${id});`;
    }

    return db.run(
      `BEGIN TRANSACTION;
            ${sql}
       COMMIT;
      `,
      [],
    );
  }

  create = undefined;

  read = undefined;

  update = undefined;

  delete = undefined;
}

export default new Question();
