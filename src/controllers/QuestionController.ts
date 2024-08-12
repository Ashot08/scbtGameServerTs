import { validationResult } from 'express-validator';
import { ISqlite } from 'sqlite';
import RunResult = ISqlite.RunResult;
import Question from '../db/models/Question.ts';
import { getCatChildrenAllDepth, getCatsTree } from '../utils/questionCats.ts';

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
        message: 'Ошибка, вероятно категория с таким названием или символьным кодом уже существует.',
        e,
      });
    }
  }

  async updateQuestionCat(req: any, res: any) {
    try {
      const validationErrors = validationResult(req);

      if (!validationErrors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Ошибка при валидации данных',
          validationErrors,
        });
      }

      const questionCatData = {
        ...req.body,
      };

      const allCats = await Question.getQuestionCats();
      const catChildrenAllDepthIds = getCatChildrenAllDepth(questionCatData.id, allCats)
        .map((cat) => cat.id);

      if (questionCatData.id === questionCatData.parent_id) {
        return res.status(400).json({
          status: 'error',
          message: 'Ошибка, нельзя сделать категорию родительской для самой себя.',
        });
      }

      if (catChildrenAllDepthIds.includes(questionCatData.parent_id)) {
        return res.status(400).json({
          status: 'error',
          message: 'Ошибка, нельзя указать в качестве родительской одну из дочерних категорий.',
        });
      }

      // if (questionCatData) {
      //   getCatChildrenAllDepth(questionCatData.id, allCats);
      //   return res.json({
      //     status: 'success',
      //     message: 'Категория вопроса успешно обновлена',
      //   });
      // }

      const result: RunResult = await Question.updateQuestionCat(questionCatData);
      if (result.changes) {
        return res.json({
          status: 'success',
          message: 'Категория вопроса успешно обновлена',
          result,
        });
      }
    } catch (e) {
      return res.status(400).json({
        status: 'error',
        message: 'Ошибка, вероятно категория с таким названием или символьным кодом уже существует.',
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
      const catsTree = getCatsTree(cats);
      if (cats) {
        return res.json({ message: 'Success Get Cats', result: { cats, catsTree } });
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
      // console.log(question);
      // return res.json({ message: 'Success Get Cats', question: question });
      const createQuestionResult = await Question.create({
        text: question.text,
        type: question.type,
        difficulty: question.difficulty,
      });
      if (!createQuestionResult.lastID) {
        return res.status(400).json({ message: 'Create Question error, question not created' });
      }
      if (Array.isArray(question.cats)) {
        for (const cat of question.cats) {
          // eslint-disable-next-line no-await-in-loop
          await Question.addCatToQuestion(cat, createQuestionResult.lastID);
        }
      }
      if (Array.isArray(question.variants)) {
        for (const variant of question.variants) {
          // eslint-disable-next-line no-await-in-loop
          await Question.createVariant({
            text: variant.text,
            correct: variant.correct,
            questionId: createQuestionResult.lastID,
          });
        }
      }
      return res.json({ message: 'Success Create Question', questionId: createQuestionResult.lastID });
    } catch (e: any) {
      return res.status(400).json({ message: 'Create Question error' });
    }
  }

  async updateQuestion(req: any, res: any) {
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

      await Question.removeAllCatsFromQuestion(question.id);
      await Question.removeAllVariantsByQuestionId(question.id);
      if (typeof question.id !== 'number') {
        return res.status(400).json({ message: 'Update Question error, question not created' });
      }
      const updateQuestionResult = await Question.update(question.id, {
        text: question.text,
        type: question.type,
        difficulty: question.difficulty,
      });
      if (!updateQuestionResult.changes) {
        return res.status(400).json({ message: 'Update Question error, question not created' });
      }
      if (Array.isArray(question.cats)) {
        for (const cat of question.cats) {
          // eslint-disable-next-line no-await-in-loop
          await Question.addCatToQuestion(cat, question.id);
        }
      }
      if (Array.isArray(question.variants)) {
        for (const variant of question.variants) {
          // eslint-disable-next-line no-await-in-loop
          await Question.createVariant({
            text: variant.text,
            correct: variant.correct,
            questionId: question.id,
          });
        }
      }
      return res.json({ message: 'Success Update Question', questionId: question.id });
    } catch (e: any) {
      return res.status(400).json({ message: 'Update Question error' });
    }
  }

  async getQuestions(req: any, res: any) {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Ошибка при валидации данных',
        validationErrors,
      });
    }
    try {
      const {
        limit, offset, text, cats,
      } = req.query;
      let count = 0;
      let questions = [];
      let filters = '';

      if (text) {
        filters = `text LIKE '%${text}%' `;
      }

      if (cats) {
        if (filters) {
          filters += `AND id IN (SELECT question_id as id FROM questions_questionCats WHERE questionCat_id IN (${cats}))`;
        } else {
          filters += `id IN (SELECT question_id as id FROM questions_questionCats WHERE questionCat_id IN (${cats}))`;
        }
      }

      const countResult = await Question.getQuestionsCount(filters);
      if (countResult.count) {
        count = countResult.count;
      }
      if (count > 0) {
        questions = await Question.getQuestions(limit, offset, filters);
      }
      return res.json({ message: 'Success Get Questions', questions, count });
    } catch (e: any) {
      return res.status(400).json({ message: 'Get Questions error' });
    }
  }

  async getQuestionById(req: any, res: any) {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Ошибка при валидации данных',
        validationErrors,
      });
    }
    try {
      const { id } = req.query;
      const questionResult = await Question.getQuestionById(id);
      if (questionResult) {
        const catsResult = await Question.getQuestionCatsByQuestionId(id);
        if (Array.isArray(catsResult)) {
          questionResult.cats = catsResult;
        }

        const variantsResult = await Question.getQuestionVariantsByQuestionId(id);
        if (Array.isArray(variantsResult)) {
          questionResult.variants = variantsResult;
        }
        return res.json({ message: 'Success Get QuestionById', questionResult });
      }
      return res.status(400).json({ message: 'Get Question error' });
    } catch (e: any) {
      return res.status(400).json({ message: 'Get Question By Id error' });
    }
  }

  async getQuestionByIdPublic(req: any, res: any) {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Ошибка при валидации данных',
        validationErrors,
      });
    }
    try {
      const { id } = req.query;
      const questionResult = await Question.getQuestionById(id);
      if (questionResult) {
        const catsResult = await Question.getQuestionCatsByQuestionId(id);
        if (Array.isArray(catsResult)) {
          questionResult.cats = catsResult;
        }

        const variantsResult = await Question.getQuestionVariantsByQuestionIdPublic(id);
        if (Array.isArray(variantsResult)) {
          questionResult.variants = variantsResult;
        }
        return res.json({ message: 'Success Get QuestionById', questionResult });
      }
      return res.status(400).json({ message: 'Get Question error' });
    } catch (e: any) {
      return res.status(400).json({ message: 'Get Question By Id error' });
    }
  }

  async deleteQuestionsByIds(req: any, res: any) {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Ошибка при валидации данных',
        validationErrors,
      });
    }
    try {
      const { ids } = req.body;
      if (Array.isArray(ids)) {
        for (const id of ids) {
          if (typeof id === 'number') {
            // eslint-disable-next-line no-await-in-loop
            await Question.delete(id);
          }
        }
        return res.json({ message: 'Success Get QuestionById' });
      }
      return res.status(400).json({ message: 'Delete Question error' });
    } catch (e: any) {
      return res.status(400).json({ message: 'Delete Question By Id error' });
    }
  }
}

export default new QuestionController();
