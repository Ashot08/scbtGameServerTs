import Game from '../db/models/Game.ts';
import Answer from '../db/models/Answer.ts';
import { getQuestionNumber } from '../utils/getQuestionNumber.ts';
import Question from '../db/models/Question.ts';

class AnswerController {
  async createAnswers(gameId: number) {
    try {
      console.log('Create answers 1');
      const turns = await Game.getTurns(gameId);
      console.log('Create answers 2');
      const players = await Game.getPlayersByGameId({ id: gameId });
      console.log('Create answers 3');
      const answers = await Answer.getAnswers(gameId);
      console.log('Create answers 4');
      if (!Array.isArray(turns) || !Array.isArray(players) || !players.length || !turns.length) {
        console.log('Create answers 5');
        return { status: 'error', message: 'Ошибка создания ответов' };
      }
      console.log('Create answers 7');
      const lastTurn = turns.slice(-1)[0];
      console.log('Create answers 8');
      const rolls = await Game.getRolls(lastTurn.id);
      console.log('Create answers 9');
      if (!Array.isArray(rolls) || !rolls.length) {
        console.log('Create answers 10');
        return { status: 'error', message: 'Ошибка создания ответов' };
      }
      console.log('Create answers 11');
      const lastRoll = rolls.slice(-1)[0];
      console.log('Create answers 12');
      const gameQuestionCats = await Question.getQuestionCatsByGameId(gameId);

      console.log('!!! Create answers 13');
      const questionNumber = getQuestionNumber(answers, gameQuestionCats);

      console.log('Create answers 14');
      let result = null;
      console.log('Create answers 15');
      for (const player of players) {
        console.log(`Create answers 16_${player.id}`);
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
        console.log(`Create answers 17_${player.id}`);
      }
      console.log('Create answers 18');
      if (result?.lastID) {
        return {
          status: 'success',
          message: 'Ответы успешно созданы',
          result: { result },
        };
      }
      console.log('Create answers 19');
      return { status: 'error', message: 'Ошибка при создании ответов' };
    } catch (e) {
      console.log('Create answers 20');
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
