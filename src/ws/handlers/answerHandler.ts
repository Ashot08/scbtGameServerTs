import GameController from '../../controllers/GameController.ts';
import AnswerController from '../../controllers/AnswerController.ts';
import { getActiveDefendsCount } from '../../utils/game.ts';
import { MAX_BRIGADIER_DEFENDS_COUNT } from '../../constants/constants.ts';

export default (io: any, socket: any) => {
  async function startAnswers() {
    try {
      await AnswerController.updateExpiredAnswerStatus('error', socket.roomId);
      const result = await AnswerController.createAnswers(socket.roomId);
      if (!result) throw new Error('Create Answers error');
      await GameController.updateAnswersMode('true', socket.roomId);
      const gameState = await GameController.getState(socket.roomId);
      io.to(socket.roomId).emit('game:updateState', gameState);
    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'Create Answers error' });
    }
  }

  async function startBrigadierAnswers() {
    try {
      const questionsCount = await GameController.getBrigadierQuestionsCount(socket.roomId);
      if (questionsCount > 0) {
        await GameController.updateBrigadierQuestionsCount(questionsCount - 1, socket.roomId);
        await AnswerController.updateExpiredAnswerStatus('error', socket.roomId);
        const result = await AnswerController.createBrigadierAnswers(socket.roomId);
        if (!result) throw new Error('createBrigadierAnswers error');
        const gameState = await GameController.getState(socket.roomId);
        io.to(socket.roomId).emit('game:updateState', gameState);
      }
    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'createBrigadierAnswers error' });
    }
  }

  async function stopBrigadierAnswers() {
    try {
      const result = await AnswerController.updateExpiredAnswerStatus('error', socket.roomId);
      if (!result) throw new Error('updateExpiredBrigadierAnswerStatus error');
      await GameController.updateBrigadierStage('finished', socket.roomId);
      const gameState = await GameController.getState(socket.roomId);
      io.to(socket.roomId).emit('game:updateState', gameState);
      io.to(socket.roomId).emit('game:stopBrigadierAnswers', gameState);
    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'updateExpiredBrigadierAnswerStatus error' });
    }
  }

  async function stopAnswers() {
    try {
      const result = await AnswerController.updateExpiredAnswerStatus('error', socket.roomId);
      if (!result) throw new Error('updateExpiredAnswerStatus error');
      // await GameController.updateShowRollResultMode(socket.roomId, 'false');
      await GameController.updateAnswersMode('false', socket.roomId);

      const gameState = await GameController.getState(socket.roomId);
      io.to(socket.roomId).emit('game:updateState', gameState);
      io.to(socket.roomId).emit('game:stopAnswers', gameState);

      // socket.emit('notification', { status: 'success', message: 'updateExpiredAnswerStatus' });
    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'updateExpiredAnswerStatus error' });
    }
  }

  async function updateAnswer(data: any) {
    try {
      const result = await AnswerController.updateAnswerStatus(data.status, data.answerId);

      if (!result) throw new Error('Update Answers error');
      const gameState = await GameController.getState(socket.roomId);

      const answer = gameState.state?.answers.find((a) => a.id === data.answerId);

      if (answer.is_countable === 'false') {
        // const timerId = setTimeout(async () => {
        //   await AnswerController.updateExpiredAnswerStatus('error', socket.roomId);
        //   const gameState = await GameController.getState(socket.roomId);
        //   io.to(socket.roomId).emit('game:updateState', gameState);
        //   clearTimeout(timerId);
        // }, 4000);

        // io.to(socket.roomId).emit('game:updateState', gameState);

        // логика ответов травма / групповая
        const playerState = await GameController.getPlayerState(socket.roomId, answer.player_id);
        const activeDefendsCount = +getActiveDefendsCount(playerState, playerState.active_worker);
        // const notActiveDefendsCount = +getNotActiveDefendsCount(playerState, playerState.active_worker);
        const questionsWithoutDefCount = playerState.questions_without_def_count;
        const questionsToActivateDefCount = playerState.questions_to_active_def_count;
        const questionsToNextWorkerCount = playerState.questions_to_next_worker_count;
        // const accidentDifficultly = playerState.accident_difficultly;
        // const accidentDifficultlyNumber = parseInt(accidentDifficultly, 10);
        // травма

        // проверяем неактивные защиты
        if (questionsToActivateDefCount > 0) {
          await GameController.updateQuestionsToActivateDef(
            playerState.player_id,
            socket.roomId,
            questionsToActivateDefCount - 1,
          );
          await GameController.updateNotActiveDefends(
            socket.roomId,
            playerState,
            -1,
          );
          if (data.status === 'success') {
            await GameController.updateActiveDefends(
              socket.roomId,
              playerState,
              1,
            );
            await GameController.updateQuestionsWithoutDef(
              playerState.player_id,
              socket.roomId,
              questionsWithoutDefCount - 1,
            );
            // если активных защит стало достаточно
            if ((activeDefendsCount + 1 >= playerState.accident_difficultly)) {
              await GameController.updateQuestionsToActivateDef(
                playerState.player_id,
                socket.roomId,
                0,
              );
              socket.emit('game:workerSaved', { status: 'Спасен' });
            }
          }
        } else if (questionsWithoutDefCount > 0) {
          // ответ без права на ошибку
          const newCount = data.status === 'error' ? 0 : questionsWithoutDefCount - 1;
          await GameController.updateQuestionsWithoutDef(
            playerState.player_id,
            socket.roomId,
            newCount,
          );
          if (data.status === 'error') {
            await GameController.applyPunishment(socket.roomId, playerState);
            if (playerState.accident_difficultly > 2) {
              socket.emit('game:workerFail', { status: 'Потеря' });
            } else {
              socket.emit('game:workerFail', { status: 'Штраф' });
            }
          }
          if (data.status === 'success') {
            if (questionsWithoutDefCount < 2) {
              socket.emit('game:workerSaved', { status: 'Спасен' });
            }
          }
        } else if (questionsToNextWorkerCount > 0) {
          // проверка соседнего рабочего при групповом НС
          await GameController.updateNextWorkerQuestionsCount(
            socket.roomId,
            playerState.player_id,
            questionsToNextWorkerCount - 1,
          );
          if (data.status === 'error') {
            await GameController.applyNextWorkerPunishment(socket.roomId, playerState);
            socket.emit('game:workerFail', { status: 'Штраф' });
          }
          if (data.status === 'success') {
            socket.emit('game:workerSaved', { status: 'Спасен' });
          }
        } else {
          // вопросов нет - выход из режима вопросов
          await GameController.updateAnswersMode('false', socket.roomId);
        }

        const gameState = await GameController.getState(socket.roomId);
        //socket.emit('game:updateState', gameState);
        io.to(socket.roomId).emit('game:updateState', gameState);
        io.to(socket.roomId).emit('answer:startTimer');
      } else {
        const gameState = await GameController.getState(socket.roomId);
        socket.emit('game:updateState', gameState);
      }
    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'Create Answers error' });
    }
  }

  async function updateBrigadierAnswer(data: any) {
    try {
      const result = await AnswerController.updateAnswerStatus(data.status, data.answerId);

      if (!result) throw new Error('Update Answers error');
      let gameState = await GameController.getState(socket.roomId);
      const answer = gameState.state?.answers.find((a) => a.id === data.answerId);
      const playerState = await GameController.getPlayerState(socket.roomId, answer.player_id);
      if (data.status === 'success') {
        const oldPlayerDefendsCount = playerState.brigadier_defends_count;
        if (oldPlayerDefendsCount < MAX_BRIGADIER_DEFENDS_COUNT) {
          await GameController.updatePlayerBrigadierDefendsCount(answer.player_id, socket.roomId, oldPlayerDefendsCount + 1);
        }
      }
      gameState = await GameController.getState(socket.roomId);
      io.to(socket.roomId).emit('game:updateState', gameState);
    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'Create Answers error' });
    }
  }

  socket.on('game:start_answers', startAnswers);
  socket.on('answers:start_brigadier_answers', startBrigadierAnswers);
  socket.on('game:stop_answers', stopAnswers);
  socket.on('answers:stop_brigadier_answers', stopBrigadierAnswers);
  socket.on('game:update_answer', updateAnswer);
  socket.on('answers:update_brigadier_answer', updateBrigadierAnswer);
};
