import BaseModel from './BaseModel.ts';
import db from '../index.ts';

export interface QuestionCatReadOptions {
  id?: number,
}

export interface QuestionCatOptions {
  id?: number,
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
    // return db.all(
    //   `SELECT c.id, c.title, c.slug
    //     FROM games_questionsCats as gc
    //     JOIN questionCats as c ON c.id = gc.questionCat_id
    //     ORDER BY c.id ASC`,
    //   gameId,
    // );
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

  async addQuestionCatToGame(catId: number | string, gameId: number) {
    return db.run(
      `INSERT INTO games_questionsCats 
            (game_id, questionCat_id) 
            VALUES (?, ?)`,
      [gameId, catId],
    );
  }

  async deleteQuestionCat(catId: number | string) {
    return db.run(
      `DELETE
            FROM questionCats
            WHERE id = ?;
            `,
      [catId],
    );
  }

  create = undefined;

  read = undefined;

  update = undefined;

  delete = undefined;
}

export default new Question();
