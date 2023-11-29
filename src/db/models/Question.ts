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

  async createQuestionCat (options: QuestionCatOptions) {
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

  // async addQuestionCatToGame () {
  //
  //   return db.run(
  //     `BEGIN TRANSACTION;
  //           INSERT OR ROLLBACK INTO Products VALUES (1, 'Hammer', 9.99);
  //           INSERT OR ROLLBACK INTO Products VALUES (2, NULL, 1.49);
  //           INSERT OR ROLLBACK INTO Products VALUES (3, 'Saw', 11.34);
  //           INSERT OR ROLLBACK INTO Products VALUES (4, 'Wrench', 37.00);
  //           INSERT OR ROLLBACK INTO Products VALUES (5, 'Chisel', 23.00);
  //           INSERT OR ROLLBACK INTO Products VALUES (6, 'Bandage', 120.00);
  //           COMMIT;
  //     `,
  //     [],
  //   );
  // }



  create = undefined;

  read = undefined;

  update = undefined;

  delete = undefined;
}

export default new Question();
