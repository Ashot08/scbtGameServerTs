import { JoinGameOptions } from '../../db/models/Game.ts';
import GameController, {
  BuyDefendsData,
  ChangeReadyStatusData,
  UpdateWorkerData
} from '../../controllers/GameController.ts';
import { isNextShift } from '../../utils/isNextShift.ts';
import { getActivePlayer } from '../../utils/getActivePlayer.ts';
import {isAllPlayersReady} from "../../utils/game.ts";


export default (io: any, socket: any) => {
  async function joinGame(data: JoinGameOptions) {
    const result = await GameController.joinGame(data);
    if (result.status === 'success') {
      const gameState = await GameController.getState(socket.roomId);

      if (gameState.status === 'success' && gameState.state?.game.status === 'in_process') {
        const activePlayer = getActivePlayer(gameState.state);
        io.to(socket.roomId).emit('game:nextShift', {
          status: true,
          message: 'Начинаем игру!',
          shift: 1,
        }, activePlayer);
      }

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

        if (gameState.status === 'success') {
          const isNext = isNextShift(gameState.state?.turns);
          const activePlayer = getActivePlayer(gameState.state);

          if (isNext.status) {
            await GameController.updateShiftChangeMode(socket.roomId, 'true');
            await GameController.paySalary(socket.roomId);
            // const gameState = await GameController.getState(socket.roomId);
            // io.to(socket.roomId).emit('game:updateState', gameState);
            io.to(socket.roomId).emit('game:nextShift', isNext, activePlayer);
          } else {
            io.to(socket.roomId).emit('game:nextPlayer', activePlayer);
          }
        }

        io.to(socket.roomId).emit('game:updateState', gameState);
      } else {
        socket.emit('notification', result);
      }
    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'Create Turn error' });
    }
  }

  async function stopGame() {
    try {
      const result = await GameController.finishGame(socket.roomId);
      if (result.status === 'success') {
        const gameState = await GameController.getState(socket.roomId);
        io.to(socket.roomId).emit('game:updateState', gameState);
        io.to(socket.roomId).emit('game:gameFinished');
      }
    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'Finish Game Error' });
    }
  }

  async function updateWorkerData(data: UpdateWorkerData) {
    try {
      const result = await GameController.updateWorkerData(socket.roomId, data);
      if(result.status === 'success') {
        const gameState = await GameController.getState(socket.roomId);
        socket.emit('game:updateState', gameState);
        socket.emit('notification', { status: 'success', message: 'Данные обновлены' });
      }
    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'update_worker_data Error' });
    }
  }

  async function buyDefends(data: BuyDefendsData) {
    try {
      const result = await GameController.buyDefends(socket.roomId, data);
      if(result.status === 'success') {
        const gameState = await GameController.getState(socket.roomId);
        socket.emit('game:updateState', gameState);
        socket.emit('notification', { status: 'success', message: 'Данные обновлены' });
      }
    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'buy_defends Error' });
    }
  }

  async function changeReadyStatus(data: ChangeReadyStatusData) {
    try {
      const result = await GameController.updatePlayerReadyStatus(socket.roomId, data);
      if(result.status === 'success') {

        const playersState = await GameController.getPlayersStateByGameId(socket.roomId);

        const allPlayersReady = isAllPlayersReady(playersState);

        if(allPlayersReady) {
          for(const p of playersState) {
            await GameController.updatePlayerReadyStatus(socket.roomId,{userId: p.player_id, readyStatus: false});
          }
          await GameController.updateShiftChangeMode(socket.roomId, 'false');
          io.to(socket.roomId).emit('game:allReadyStartShift');
        }

        const gameState = await GameController.getState(socket.roomId);
        io.to(socket.roomId).emit('game:updateState', gameState);
        // socket.emit('notification', { status: 'success', message: 'Готов!' });
      }
    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'changeReadyStatus Error' });
    }
  }

  socket.on('game:join', joinGame);
  socket.on('game:getState', getState);
  socket.on('game:create_roll', roll);
  socket.on('game:create_turn', createTurn);
  socket.on('game:stop_game', stopGame);
  socket.on('game:update_worker_data', updateWorkerData);
  socket.on('game:buy_defends', buyDefends);
  socket.on('game:change_ready_status', changeReadyStatus);
};
