import { validationResult } from 'express-validator';
import { ISqlite } from 'sqlite';
import RunResult = ISqlite.RunResult;
import Question from '../db/models/Question.ts';

class QuestionController {
  async createQuestionCat(req: any, res: any) {
    try {
      const validationErrors = validationResult(req);

      if (!validationErrors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Ошибка при валидации данных',
          validationErrors,
        });
      }

      const questionCat = {
        ...req.body,
      };

      const result: RunResult = await Question.createQuestionCat(questionCat);

      if (result.lastID) {
        return res.json({
          status: 'success',
          message: 'Категория вопроса успешно создана',
          result,
        });
      }
    } catch (e) {
      return res.status(400).json({
        status: 'error',
        message: 'Ошибка, вероятно категория с таким названием уже существует.',
        e,
      });
    }
  }

  async deleteQuestionCats(req: any, res: any) {
    try {
      const { catsIds } = req.body;
      if (!Array.isArray(catsIds) || !catsIds.length) {
        return res.status(200).json({ status: 'error', message: 'Delete Cats error (empty cats)' });
      }
      let result;

      for (const id of catsIds) {
        // eslint-disable-next-line no-await-in-loop
        result = await Question.deleteQuestionCat(id);
      }

      if (1) {
        return res.json({ status: 'success', message: 'Success Delete Cats', result });
      }
      return res.status(200).json({ status: 'error', message: 'Delete Cats error', result });
    } catch (e: any) {
      return res.status(400).json({ status: 'error', message: 'Delete Cats error', e: e.message });
    }
  }

  // @ts-expect-error: unused variable 'req'
  async getQuestionCats(req: any, res: any) {
    try {
      const cats = await Question.getQuestionCats();

      if (cats) {
        return res.json({ message: 'Success Get Cats', cats });
      }
      return res.status(200).json({ message: 'Get Cats error' });
    } catch (e) {
      return res.status(400).json({ message: 'Get Cats error' });
    }
  }

  async getQuestionCatsByGameId(req: any, res: any) {
    try {
      const { gameId } = req.params;
      const cats = await Question.getQuestionCatsByGameId(gameId);

      if (cats) {
        return res.json({ message: 'Success Get Cats', cats });
      }
      return res.status(200).json({ message: 'Get Cats error' });
    } catch (e) {
      return res.status(400).json({ message: 'Get Cats error' });
    }
  }

  async createQuestion(req: any, res: any) {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Ошибка при валидации данных',
        validationErrors,
      });
    }

    try {
      const question = { ...req.body };

      const createQuestionResult = await Question.create({
        text: question.text,
        type: question.type,
        difficulty: question.difficulty,
      });
      if (!createQuestionResult.lastID) {
        return res.status(400).json({ message: 'Create Question error, question not created' });
      }

      return res.json({ message: 'Success Get Cats', questionId: createQuestionResult.lastID });
    } catch (e: any) {
      console.log(e.message);
      return res.status(400).json({ message: 'Create Question error' });
    }
  }
}

export default new QuestionController();
