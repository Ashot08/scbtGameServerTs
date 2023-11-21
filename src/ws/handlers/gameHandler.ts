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
    const gameState = await GameController.getState(socket.roomId);
    io.to(socket.roomId).emit('game:updateState', gameState);
  }

  socket.on('game:join', joinGame);
  socket.on('game:getState', getState);
};
