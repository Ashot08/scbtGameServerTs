import GameController from '../../controllers/GameController.ts';
import AnswerController from '../../controllers/AnswerController.ts';

export default (io: any, socket: any) => {
  async function startAnswers() {
    try {
      const result = await AnswerController.createAnswers(socket.roomId);
      if (!result) throw new Error('Create Answers error');

      await GameController.updateAnswersMode('true', socket.roomId);

      const gameState = await GameController.getState(socket.roomId);
      io.to(socket.roomId).emit('game:updateState', gameState);
    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'Create Answers error' });
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
        io.to(socket.roomId).emit('answer:startTimer', gameState);

        setTimeout(async () => {
          // io.to(socket.roomId).emit('answer:stopTimer', gameState);
          await AnswerController.updateExpiredAnswerStatus('error', socket.roomId);
          const gameState = await GameController.getState(socket.roomId);
          io.to(socket.roomId).emit('game:updateState', gameState);
        }, 3500);

        // логика ответов травма / групповая
        const playerState = await GameController.getPlayerState(socket.roomId, answer.player_id);
        // const activeDefendsCount = +getActiveDefendsCount(playerState, playerState.active_worker);
        // const notActiveDefendsCount = +getNotActiveDefendsCount(playerState, playerState.active_worker);
        const questionsWithoutDefCount = playerState.questions_without_def_count;
        const questionsToActivateDefCount = playerState.questions_to_active_def_count;
        const questionsToNextWorkerCount = playerState.questions_to_next_worker_count;
        // const accidentDifficultly = playerState.accident_difficultly;
        // const accidentDifficultlyNumber = parseInt(accidentDifficultly, 10);
        // травма

        // io.to(socket.roomId).emit('game:workerFail', { status: 'Потеря' });
        // io.to(socket.roomId).emit('game:workerFail', { status: 'Штраф' });
        // io.to(socket.roomId).emit('game:workerSaved', { status: 'Спасен' });

        // проверяем неактивные защиты
        if (questionsToActivateDefCount > 0) {
          await GameController.updateQuestionsToActivateDef(
            playerState.player_id,
            socket.roomId,
            -1,
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
          }
        } else {
          // вопросов нет - выход из режима вопросов
          await GameController.updateAnswersMode('false', socket.roomId);
        }
      }

      io.to(socket.roomId).emit('game:updateState', gameState);
    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'Create Answers error' });
    }
  }

  socket.on('game:start_answers', startAnswers);
  socket.on('game:stop_answers', stopAnswers);
  socket.on('game:update_answer', updateAnswer);
};
