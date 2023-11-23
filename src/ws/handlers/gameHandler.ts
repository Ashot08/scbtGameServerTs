import { JoinGameOptions } from '../../db/models/Game.ts';
import GameController from '../../controllers/GameController.ts';

export default (io: any, socket: any) => {
  async function joinGame(data: JoinGameOptions) {
    const result = await GameController.joinGame(data);
    if (result.status === 'success') {
      const gameState = await GameController.getState(socket.roomId);
      console.log(gameState);
      io.to(socket.roomId).emit('game:updateState', gameState);
      socket.emit('notification', result);
    } else {
      socket.emit('notification', result);
    }
  }

  async function getState() {
    try {
      const gameState = await GameController.getState(socket.roomId);
      io.to(socket.roomId).emit('game:updateState', gameState);
    } catch (e) {
      console.log(e);
    }
  }

  async function roll() {
    try {
      const result = await GameController.createRoll(socket.roomId);

      if (!result) throw new Error('Create Roll error');

      if (result.status === 'success') {
        io.to(socket.roomId).emit('game:roll', result);
        const gameState = await GameController.getState(socket.roomId);
        io.to(socket.roomId).emit('game:updateState', gameState);
      } else {
        socket.emit('notification', result);
      }
    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'Create Roll error' });
    }
  }

  async function createTurn() {
    try {
      const result = await GameController.createTurn(socket.roomId);

      if (!result) throw new Error('Create Turn error');

      if (result.status === 'success') {
        const gameState = await GameController.getState(socket.roomId);
        io.to(socket.roomId).emit('game:updateState', gameState);
      } else {
        socket.emit('notification', result);
      }
    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'Create Turn error' });
    }
  }

  async function startAnswers() {
    try {
      const result = await GameController.createAnswers(socket.roomId);
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
      const result = await GameController.updateExpiredAnswerStatus('error', socket.roomId);
      if (!result) throw new Error('updateExpiredAnswerStatus error');

      await GameController.updateAnswersMode('false', socket.roomId);

      const gameState = await GameController.getState(socket.roomId);
      io.to(socket.roomId).emit('game:updateState', gameState);

      socket.emit('notification', { status: 'success', message: 'updateExpiredAnswerStatus' });

    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'updateExpiredAnswerStatus error' });
    }
  }

  async function updateAnswer(data: any) {
    try {
      const result = await GameController.updateAnswerStatus(data.status, data.answerId);
      if (!result) throw new Error('Update Answers error');
      const gameState = await GameController.getState(socket.roomId);
      io.to(socket.roomId).emit('game:updateState', gameState);
    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'Create Answers error' });
    }
  }

  socket.on('game:join', joinGame);
  socket.on('game:getState', getState);
  socket.on('game:create_roll', roll);
  socket.on('game:create_turn', createTurn);
  socket.on('game:start_answers', startAnswers);
  socket.on('game:stop_answers', stopAnswers);
  socket.on('game:update_answer', updateAnswer);
};
