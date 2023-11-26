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

      await GameController.updateAnswersMode('false', socket.roomId);

      const gameState = await GameController.getState(socket.roomId);
      io.to(socket.roomId).emit('game:updateState', gameState);
      io.to(socket.roomId).emit('game:stopAnswers', gameState);

      socket.emit('notification', { status: 'success', message: 'updateExpiredAnswerStatus' });
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
