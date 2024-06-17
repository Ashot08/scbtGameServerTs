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

export interface QuestionOptions {
  text: string,
  type: number,
  difficulty: number,
}

export interface QuestionVariantOptions {
  text: string,
  correct: string,
  questionId: number,
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

  async create(data: QuestionOptions) {
    const { text, difficulty, type } = data;
    return db.run(
      `INSERT INTO questions 
            (text, difficulty, type) 
            VALUES (?, ?, ?)`,
      [text, difficulty, type],
    );
  }

  async update(id: number, data: QuestionOptions) {
    const { text, difficulty, type } = data;
    return db.run(`UPDATE questions 
        SET text = ?, 
        difficulty = ?, 
        type = ? 
        WHERE id = ?`, text, difficulty, type, id);
  }

  async createVariant(data: QuestionVariantOptions) {
    const { text, correct, questionId } = data;
    return db.run(
      `INSERT INTO variants 
            (text, correct, question_id) 
            VALUES (?, ?, ?)`,
      [text, correct, questionId],
    );
  }

  async addCatToQuestion(catId: number, questionId: number) {
    return db.run(
      `INSERT INTO questions_questionCats 
            (questionCat_id, question_id) 
            VALUES (?, ?)`,
      [catId, questionId],
    );
  }

  async removeAllCatsFromQuestion(questionId: number) {
    return db.run(
      `DELETE
            FROM questions_questionCats
            WHERE question_id = ?;
            `,
      [questionId],
    );
  }

  async removeAllVariantsByQuestionId(questionId: number) {
    return db.run(
      `DELETE
            FROM variants
            WHERE question_id = ?;
            `,
      [questionId],
    );
  }

  async getQuestions(limit = 5, offset = 0, filters: any) {
    console.log(filters);
    return db.all(
      `SELECT *
        FROM questions
        ORDER BY id DESC
        LIMIT ? OFFSET ?`,
      [limit, offset],
    );
  }

  async getQuestionsCount(filters: any) {
    console.log(filters);
    return db.get(
      `SELECT COUNT(*) as count
        FROM questions`,
    );
  }

  async getQuestionById(id: number) {
    return db.get(
      `SELECT *
        FROM questions
        WHERE id = ?`,
      [id],
    );
  }

  async getQuestionCatsByQuestionId(questionId: number) {
    return db.all(
      `SELECT c.id, c.title, c.slug
        FROM questions_questionCats as qc
        JOIN questionCats as c ON c.id = qc.questionCat_id
        WHERE qc.question_id = ? ORDER BY c.id ASC`,
      questionId,
    );
  }

  async getQuestionVariantsByQuestionId(questionId: number) {
    return db.all(
      `SELECT *
        FROM variants 
        WHERE question_id = ? ORDER BY id ASC`,
      questionId,
    );
  }

  read = undefined;

  delete = undefined;
}

export default new Question();
