import {validationResult} from "express-validator";
import Question, {QuestionOptions} from "../db/models/Question.ts";
import {getQuestionNumber} from "../utils/getQuestionNumber.ts";
import {ISqlite} from "sqlite";
import RunResult = ISqlite.RunResult;
import Shootout, {CreateShootoutData} from "../db/models/Shootout.ts";

class ShootoutController {
  async createShootout(req: any, res: any) {
    try {
      const validationErrors = validationResult(req);

      if (!validationErrors.isEmpty()) {
        return res.status(400).json({ status: 'error', message: 'createShootout Ошибка при валидации данных', validationErrors });
      }

      const shootout = {
        ...req.body,
        status: 'ready',
        level: 0,
        questionId: 0,
      };

      if(!shootout.gameId || !shootout.players) {
        return res.status(400).json({ status: 'error', message: 'createShootout error', });
      }

      let gameQuestionCats = await Question.getQuestionCatsByGameIdActive(shootout.gameId);
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
      const questionNumber = getQuestionNumber(questions, []);

      if(!questionNumber) {
        return { status: 'error', message: 'Ошибка при создании ответов, нет вопросов' };
      }
      shootout.questionId = questionNumber;

      const result: RunResult = await Shootout.create(shootout);
      if (result.lastID) {
        const playersIdsArray = shootout.players.split(',');

        for (const playerId of playersIdsArray) {
          await Shootout.createShootoutPlayersAnswers({
            playerId: +(playerId.trim()),
            shootoutId: result.lastID,
            successAnswers: 0,
            answersCount: 0,
          })
        }
        return res.json({ status: 'success', message: 'createShootout успешно создана', result });
      }
    } catch (e) {
      return res.status(400).json({ message: 'createShootout Creation error', e });
    }
  }

  async createShootoutPlayersAnswers(req: any, res: any) {
    try {
      const validationErrors = validationResult(req);

      if (!validationErrors.isEmpty()) {
        return res.status(400).json({ status: 'error', message: 'createShootoutPlayersAnswers Ошибка при валидации данных', validationErrors });
      }

      const data = {
        ...req.body,
        successAnswers: 0,
        answersCount: 0,
      };

      const result: RunResult = await Shootout.createShootoutPlayersAnswers(data);
      if (result.lastID) {
        return res.json({ status: 'success', message: 'createShootoutPlayersAnswers успешно создана', result });
      }
    } catch (e) {
      return res.status(400).json({ message: 'createShootoutPlayersAnswers Creation error', e });
    }
  }

  async updateShootoutStatus(status: CreateShootoutData['status'], gameId: number){
    await Shootout.updateStatus(status, gameId);
  }

  async updateShootoutLevel(level: number, gameId: number){
    await Shootout.updateLevel(level, gameId);
  }

}

export default new ShootoutController();
