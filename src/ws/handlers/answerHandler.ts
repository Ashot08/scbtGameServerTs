import GameController from '../../controllers/GameController.ts';
import AnswerController from '../../controllers/AnswerController.ts';
import {
  getActiveDefendsCount, getNewActiveDefendsScheme,
  getNewWorkersPositionsScheme,
  getNextWorkerIndex,
  getNotActiveDefendsCount,
} from '../../utils/game.ts';
import Game from '../../db/models/Game.ts';

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
        let playerState = await GameController.getPlayerState(socket.roomId, answer.player_id);
        const activeDefendsCount = +getActiveDefendsCount(playerState, playerState.active_worker);
        const notActiveDefendsCount = +getNotActiveDefendsCount(playerState, playerState.active_worker);
        let questionsWithoutDefCount = playerState.questions_without_def_count;
        let questionsToActivateDefCount = playerState.questions_to_active_def_count;
        const accidentDifficultly = playerState.accident_difficultly;
        // травма

        if (data.status === 'error') {
          if (notActiveDefendsCount) {
            await GameController.updateNotActiveDefends(socket.roomId, playerState, -1);
            await Game.updateQuestionsToActivateDef(playerState.player_id, socket.roomId, notActiveDefendsCount - 1);
          } else if (questionsWithoutDefCount) {
            // Проигрыш
            await Game.updateQuestionsWithoutDef(playerState.player_id, socket.roomId, 0);
            if (accidentDifficultly > 2) {
              const newWorkersScheme = getNewWorkersPositionsScheme(playerState, playerState.active_worker, true);
              await Game.updateWorkersPositions(playerState.player_id, socket.roomId, newWorkersScheme);
              io.to(socket.roomId).emit('game:workerFail', { status: 'Потеря' });
            } else {
              if (playerState.money > 0) {
                await Game.updatePlayerMoney(playerState.player_id, socket.roomId, playerState.money - 1);
              }
              io.to(socket.roomId).emit('game:workerFail', { status: 'Штраф' });
            }
            let nextWorker = getNextWorkerIndex(playerState, playerState.active_worker);
            await Game.updatePlayerActiveWorker(playerState.player_id, socket.roomId, nextWorker);
            nextWorker = getNextWorkerIndex(playerState, nextWorker);
            await Game.updatePlayerNextWorkerIndex(playerState.player_id, socket.roomId, nextWorker);
            await Game.updateQuestionsWithoutDef(playerState.player_id, socket.roomId, 0);
            await Game.updateAccidentDiff(playerState.player_id, socket.roomId, 100);
            await GameController.updateAnswersMode('false', socket.roomId);
          }
        }

        if (data.status === 'success') {
          if (notActiveDefendsCount) {
            await Game.updateQuestionsToActivateDef(playerState.player_id, socket.roomId, activeDefendsCount - 1);
            const newActiveDefendsScheme = getNewActiveDefendsScheme(playerState, playerState.active_worker, 1);
            await Game.updateWorkerActiveDefends(playerState.player_id, socket.roomId, newActiveDefendsScheme);
            // add active def
          } else if (questionsWithoutDefCount) {
            await Game.updateQuestionsWithoutDef(playerState.player_id, socket.roomId, questionsWithoutDefCount - 1);
          }
          playerState = await GameController.getPlayerState(socket.roomId, answer.player_id);
          questionsWithoutDefCount = playerState.questions_without_def_count;
          questionsToActivateDefCount = playerState.questions_to_active_def_count;
          if (questionsWithoutDefCount === 0 && questionsToActivateDefCount === 0) {
            // Выход
            let nextWorker = getNextWorkerIndex(playerState, playerState.active_worker);
            await Game.updatePlayerActiveWorker(playerState.player_id, socket.roomId, nextWorker);
            nextWorker = getNextWorkerIndex(playerState, nextWorker);
            await Game.updatePlayerNextWorkerIndex(playerState.player_id, socket.roomId, nextWorker);
            await Game.updateQuestionsWithoutDef(playerState.player_id, socket.roomId, 0);
            await Game.updateAccidentDiff(playerState.player_id, socket.roomId, 100);
            await GameController.updateAnswersMode('false', socket.roomId);
            io.to(socket.roomId).emit('game:workerSaved', { status: 'Спасен' });
          }
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
