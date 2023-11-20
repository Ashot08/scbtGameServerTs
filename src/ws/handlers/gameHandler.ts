import { JoinGameOptions } from '../../db/models/Game.ts';
import GameController from '../../controllers/GameController.ts';

export default (io: any, socket: any) => {
  async function joinGame(data: JoinGameOptions) {
    const result = await GameController.joinGame(data);
    if (result.status === 'success') {
      const gameState = GameController.getState(socket.roomId);
      io.to(socket.roomId).emit('game:updateState', gameState);
      io.to(socket.roomId).emit('notification', result);
    } else {
      io.to(socket.roomId).emit('notification', result);
    }
  }

  socket.on('game:join', joinGame);
};
