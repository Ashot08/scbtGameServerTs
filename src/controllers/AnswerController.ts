import Game from '../db/models/Game.ts';
import Answer from '../db/models/Answer.ts';
import { getQuestionNumber } from '../utils/getQuestionNumber.ts';
import Question, { QuestionOptions } from '../db/models/Question.ts';
import { AnswerCorrect } from '../typings/types.ts';

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
          startTime: Date.now(),
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
          startTime: Date.now(),
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
}

export default new AnswerController();
