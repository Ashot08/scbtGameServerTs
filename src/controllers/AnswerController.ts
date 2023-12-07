import Game from '../db/models/Game.ts';
import Answer from '../db/models/Answer.ts';
import { getQuestionNumber } from '../utils/getQuestionNumber.ts';
import Question from '../db/models/Question.ts';

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

      const gameQuestionCats = await Question.getQuestionCatsByGameId(gameId);

      const questionNumber = getQuestionNumber(answers, gameQuestionCats);

      let result = null;

      for (const player of players) {
        const isCountable: 'true' | 'false' = (player.id === lastTurn.player_id) ? 'false' : 'true';

        // eslint-disable-next-line no-await-in-loop
        result = await Answer.create({
          turnId: lastTurn.id,
          gameId,
          playerId: player.id,
          rollId: lastRoll.id,
          questionId: questionNumber,
          isCountable,
          status: 'in_process',
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

  async updateAnswerStatus(status: 'error' | 'success' | 'in_process', answerId: number) {
    try {
      const result = await Answer.updateAnswerStatus(status, answerId);
      if (result.changes) {
        return { status: 'success', message: 'Ответ обновлен' };
      }
      return { status: 'error', message: 'Ошибка при обновлении ответа' };
    } catch (e) {
      return { status: 'error', message: 'Ошибка при обновлении ответа' };
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
}

export default new AnswerController();
