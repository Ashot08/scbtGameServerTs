import { ISqlite } from 'sqlite';
import { validationResult } from 'express-validator';
import Game from '../db/models/Game.ts';
import Answer from '../db/models/Answer.ts';
import { getQuestionNumber } from '../utils/getQuestionNumber.ts';
import Question, { QuestionOptions } from '../db/models/Question.ts';
import { AnswerCorrect } from '../typings/types.ts';
import RunResult = ISqlite.RunResult;

class AnswerController {
  async createAnswers(gameId: number) {
    try {
      const turns = await Game.getTurns(gameId);
      const players = await Game.getPlayersByGameId({ id: gameId });
      const answers = await Answer.getAnswers(gameId);
      if (!Array.isArray(turns) || !Array.isArray(players) || !players.length || !turns.length) {
        return { status: 'error', message: 'Ошибка создания ответов' };
      }
      const lastTurn = turns.slice(-1)[0];
      const rolls = await Game.getRolls(lastTurn.id);
      if (!Array.isArray(rolls) || !rolls.length) {
        return { status: 'error', message: 'Ошибка создания ответов' };
      }
      const lastRoll = rolls.slice(-1)[0];

      let gameQuestionCats = await Question.getQuestionCatsByGameIdActive(gameId);

      let questions: QuestionOptions[] = [];
      if (!Array.isArray(gameQuestionCats) || !gameQuestionCats.length) {
        gameQuestionCats = await Question.getQuestionCatsActive();
      }
      if (!Array.isArray(gameQuestionCats) || !gameQuestionCats.length) {
        gameQuestionCats = [];
      }

      questions = await Question.getAllQuestionsByCats(gameQuestionCats.map((c) => c.id)) as QuestionOptions[];
      if (!Array.isArray(questions) || !questions.length) {
        return { status: 'error', message: 'Ошибка при создании ответов, нет вопросов' };
      }

      const questionNumber = getQuestionNumber(questions, answers);
      let result = null;
      const startTime = Date.now();
      for (const player of players) {
        const isActivePlayerQuestion: 'true' | 'false' = (player.id === lastTurn.player_id) ? 'true' : 'false';
        // eslint-disable-next-line no-await-in-loop
        result = await Answer.create({
          turnId: lastTurn.id,
          gameId,
          playerId: player.id,
          rollId: lastRoll.id,
          questionId: questionNumber,
          isActivePlayerQuestion,
          status: 'in_process',
          startTime,
          endTime: 0,
        });
      }
      if (result?.lastID) {
        return {
          status: 'success',
          message: 'Ответы успешно созданы',
          result: { result },
        };
      }
      return { status: 'error', message: 'Ошибка при создании ответов' };
    } catch (e) {
      return { status: 'error', message: 'Ошибка при создании ответов' };
    }
  }

  async createBrigadierAnswers(gameId: number) {
    try {
      const players = await Game.getPlayersByGameId({ id: gameId });
      const answers = await Answer.getAnswers(gameId);
      if (!Array.isArray(players) || !players.length) {
        return { status: 'error', message: 'Ошибка создания ответов Brigadier' };
      }

      let gameQuestionCats = await Question.getQuestionCatsByGameIdActive(gameId);
      let questions: QuestionOptions[] = [];
      if (!Array.isArray(gameQuestionCats) || !gameQuestionCats.length) {
        gameQuestionCats = await Question.getQuestionCatsActive();
      }
      if (!Array.isArray(gameQuestionCats) || !gameQuestionCats.length) {
        gameQuestionCats = [];
      }
      questions = await Question.getAllQuestionsByCats(gameQuestionCats.map((c) => c.id)) as QuestionOptions[];
      if (!Array.isArray(questions) || !questions.length) {
        return { status: 'error', message: 'Ошибка при создании ответов, нет вопросов' };
      }
      const questionNumber = getQuestionNumber(questions, answers);
      let result = null;
      const startTime = Date.now();
      for (const player of players) {
        const isActivePlayerQuestion: 'true' | 'false' = 'true';

        // eslint-disable-next-line no-await-in-loop
        result = await Answer.create({
          turnId: 0,
          gameId,
          playerId: player.id,
          rollId: 0,
          questionId: questionNumber,
          isActivePlayerQuestion,
          status: 'in_process',
          startTime,
          endTime: 0,
        });
      }
      if (result?.lastID) {
        return {
          status: 'success',
          message: 'Ответы Brigadier успешно созданы',
          result: { result },
        };
      }
      return { status: 'error', message: 'Ошибка при создании ответов Brigadier' };
    } catch (e) {
      return { status: 'error', message: 'Ошибка при создании ответов Brigadier' };
    }
  }

  async updateAnswerStatus(status: 'error' | 'success' | 'in_process', answerId: number) {
    try {
      const result = await Answer.updateAnswerStatus(status, answerId);
      if (result.changes) {
        return {
          status: 'success',
          message: 'Ответ обновлен',
          correct: (status === 'success') ? 'true' : 'false',
        };
      }
      return { status: 'error', message: 'Ошибка при обновлении ответа' };
    } catch (e) {
      return { status: 'error', message: 'Ошибка при обновлении ответа' };
    }
  }

  async checkCorrectAndUpdateAnswer(variantId: number, answerId: number) {
    try {
      const variant = await Question.getQuestionVariantById(variantId);
      if (variant) {
        const status = (variant.correct === AnswerCorrect.True) ? 'success' : 'error';
        return await this.updateAnswerStatus(status, answerId);
      }
      return await this.updateAnswerStatus('error', answerId);
    } catch (e) {
      return { status: 'error', message: 'Ошибка при проверке и обновлении ответа 2' };
    }
  }

  async checkCorrectAndUpdateAnswerByAnswerId(answerId: number, gameId: number) {
    try {
      const tempAnswers = await Answer.getTempAnswers(gameId);

      const answer = await Answer.read({ id: answerId });
      if (!answer || answer?.status !== 'in_process') {
        throw new Error('Ошибка при проверке и обновлении ответа 1');
      }
      const tempAnswer = tempAnswers
        .filter((a) => a.answer_id === answerId)
        .slice(-1)[0];

      if (tempAnswer) {
        const variant = await Question.getQuestionVariantById(tempAnswer.variant_id);
        if (variant) {
          const status = (variant.correct === AnswerCorrect.True) ? 'success' : 'error';
          return await this.updateAnswerStatus(status, answerId);
        }
      }

      return await this.updateAnswerStatus('error', answerId);
    } catch (e) {
      return { status: 'error', message: 'Ошибка при проверке и обновлении ответа 2' };
    }
  }

  async updateAnswerEndTime(endTime: number, answerId: number) {
    try {
      const result = await Answer.updateAnswerEndTime(endTime, answerId);
      if (result.changes) {
        return { status: 'success', message: 'success updateAnswerEndTime' };
      }
      return { status: 'error', message: 'Ошибка при updateAnswerEndTime' };
    } catch (e) {
      return { status: 'error', message: 'Ошибка при updateAnswerEndTime' };
    }
  }

  async updateExpiredAnswerStatus(status: 'success' | 'error', gameId: number) {
    try {
      const result = await Answer.updateExpiredAnswerStatus(status, gameId);

      if (result) {
        return { status: 'success', message: 'Успех при обновлении ExpiredAnswerStatus' };
      }
      return { status: 'error', message: 'Ошибка при обновлении ExpiredAnswerStatus' };
    } catch (e) {
      return { status: 'error', message: 'Ошибка при обновлении ExpiredAnswerStatus' };
    }
  }

  async updateExpiredAnswerEndTime(gameId: number) {
    try {
      const result = await Answer.updateExpiredAnswerEndTime(gameId);

      if (result) {
        return { status: 'success', message: 'Успех при обновлении ExpiredAnswerEndTime' };
      }
      return { status: 'error', message: 'Ошибка при обновлении ExpiredAnswerEndTime' };
    } catch (e) {
      return { status: 'error', message: 'Ошибка при обновлении ExpiredAnswerEndTime' };
    }
  }

  async createTempAnswer(req: any, res: any) {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Ошибка при валидации данных createTempAnswer',
          validationErrors,
        });
      }

      const answer = {
        ...req.body,
        timestamp: Date.now(),
      };

      const parentAnswer = await Answer.read({ id: answer?.answerId });
      if (!parentAnswer || !(parentAnswer?.status === 'in_process')) {
        return res.json({ status: 'error', message: 'createTempAnswer Error' });
      }

      const result: RunResult = await Answer.createTempAnswer(answer);
      if (result.lastID) {
        return res.json({ status: 'success', message: 'Временный ответ успешно создан', result });
      }
    } catch (e) {
      return res.json({ status: 'error', message: 'createTempAnswer Error' });
    }
  }

  async createWatcherAnswer(req: any, res: any) {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Ошибка при валидации данных createWatcherAnswer',
          validationErrors,
        });
      }

      const answer = {
        ...req.body,
        timestamp: Date.now(),
        status: 'error',
      };

      const existingAnswer = await Answer.readWatcherAnswers({
        gameId: answer?.gameId,
        questionId: answer?.questionId,
        playerId: answer?.playerId,
      });

      if (existingAnswer) {
        return res.json({ status: 'error', message: 'createWatcherAnswer Error 1' });
      }

      const variant = await Question.getQuestionVariantByQuestionIdAndVariantId(answer.questionId, answer.variantId);
      if (variant) {
        answer.status = (variant.correct === AnswerCorrect.True) ? 'success' : 'error';
      }
      const result: RunResult = await Answer.createWatcherAnswer(answer);
      if (result.lastID) {
        return res.json({
          status: 'success',
          message: 'createWatcherAnswer успешно создан',
          result,
          answerStatus: answer.status,
        });
      }
    } catch (e) {
      console.log(e);
      return res.json({ status: 'error', message: 'createWatcherAnswer Error 2' });
    }
  }

  async getTempAnswersByGameId(req: any, res: any) {
    try {
      const { gameId } = req.query;
      const answers = await Answer.getTempAnswers(gameId);
      return res.status(200).json({
        answers,
        status: 'success',
        message: 'getTempAnswersByGameId success',
      });
    } catch (e) {
      return res.json({ status: 'error', message: 'getTempAnswersByGameId Error' });
    }
  }

  async checkTempAnswersAndWriteAnswers(gameId: number) {
    try {
      const answersInProcess = await Answer.getAnswersInProcess(gameId);
      if (Array.isArray(answersInProcess)) {
        const tempAnswers = await Answer.getTempAnswers(gameId);
        for (const answer of answersInProcess) {
          const tempAnswer = tempAnswers
            .filter((a) => a.answer_id === answer.id)
            .slice(-1)[0];
          if (tempAnswer) {
            await this.checkCorrectAndUpdateAnswer(tempAnswer.variant_id, answer.id);
          } else {
            await this.updateAnswerStatus('error', answer.id);
          }
        }
      }
      return { status: 'success', message: 'checkTempAnswersAndWriteAnswers Success' };
    } catch (e) {
      return { status: 'error', message: 'getTempAnswersByGameId Error' };
    }
  }

  async getWatcherAnswersByGameId(req: any, res: any) {
    try {
      const { gameId } = req.query;
      const answers = await Answer.getWatcherAnswers(gameId);
      return res.status(200).json({
        answers,
        status: 'success',
        message: 'getWatcherAnswersByGameId success',
      });
    } catch (e) {
      return res.json({ status: 'error', message: 'getWatcherAnswersByGameId Error' });
    }
  }
}

export default new AnswerController();
