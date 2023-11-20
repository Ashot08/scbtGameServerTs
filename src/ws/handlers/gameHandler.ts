import {JoinGameOptions} from "../../db/models/Game.ts";
import GameController from "../../controllers/GameController.ts";

export default (io: any, socket: any) => {

  function joinGame (data: JoinGameOptions) {
    const result = GameController.joinGame(data);
    if (result.status === 'success') {
      const gameState = GameController.getState(socket.gameId);
      io.to(socket.gameId).emit('game:updateState', gameState);
      io.to(socket.gameId).emit('notification', result);
    }
  }

  socket.on('game:join', joinGame);
}
