import Game, { JoinGameOptions } from '../../db/models/Game.ts';
import GameController, {
  BuyDefendsData,
  ChangeReadyStatusData,
  UpdateWorkerData,
} from '../../controllers/GameController.ts';
import { isNextShift } from '../../utils/isNextShift.ts';
import { getActivePlayer } from '../../utils/getActivePlayer.ts';
import {
  getAccidentDifficultlyByPrizeNumber,
  getActiveDefendsCount,
  getNotActiveDefendsCount,
  isAllPlayersReady
} from '../../utils/game.ts';

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
        await GameController.updateShowRollResultMode(socket.roomId, 'true');

        const accidentDifficultly = getAccidentDifficultlyByPrizeNumber(result.result?.prizeNumber);
        const accidentDifficultlyNumber = parseInt(accidentDifficultly);
        const userId = result.result?.lastTurn.player_id;
        const playerState = await GameController.getPlayerState(socket.roomId, userId);
        const activeDefends = getActiveDefendsCount(playerState, playerState.active_worker);
        const notActiveDefends = getNotActiveDefendsCount(playerState, playerState.active_worker);

        // refresh
        await GameController.updatePlayerNextWorkerMode(socket.roomId, playerState.player_id, 'false');
        await GameController.updateNextWorkerQuestionsCount(socket.roomId, playerState.player_id, 0);

        // update
        await Game.updateAccidentDiff(playerState.player_id, socket.roomId, parseInt(accidentDifficultly));

        switch (accidentDifficultly) {
          case '0':
            // Бонус
            await GameController.onRollBonus(socket.roomId, playerState);
            break;
          case '3 + 1':
          case '6 + 1':
            // update next worker index
            // update next worker mode
            // update next worker questions count
            await GameController.updatePlayerNextWorkerIndex(socket.roomId, playerState);
            await GameController.updatePlayerNextWorkerMode(socket.roomId, playerState.player_id, 'true');
            await GameController.updateNextWorkerQuestionsCount(socket.roomId, playerState.player_id, 1);
          default:
            // Травма
            if(activeDefends >= accidentDifficultlyNumber) {

            } else {
              const needToActivateDefendsCount = accidentDifficultlyNumber - activeDefends;
              let newQuestionsToActivateDefCount = 0;

              if(notActiveDefends > needToActivateDefendsCount) {
                newQuestionsToActivateDefCount = needToActivateDefendsCount;
              } else {
                newQuestionsToActivateDefCount = notActiveDefends;
              }

              await GameController.updateQuestionsToActivateDef(playerState.player_id, socket.roomId, newQuestionsToActivateDefCount);
              await GameController.updateQuestionsWithoutDef(
                playerState.player_id, socket.roomId, accidentDifficultlyNumber - activeDefends
              );
              // await GameController.onAccident(socket.roomId, playerState);
            }
            break;
        }

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
            await GameController.paySalaryAndUpdateNoMoreRolls(socket.roomId);
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
      if (result.status === 'success') {
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
      if (result.status === 'success') {
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
      if (result.status === 'success') {
        const playersState = await GameController.getPlayersStateByGameId(socket.roomId);

        const allPlayersReady = isAllPlayersReady(playersState);

        if (allPlayersReady) {
          for (const p of playersState) {
            /* eslint-disable */
            await GameController.updatePlayerReadyStatus(socket.roomId, { userId: p.player_id, readyStatus: false });
            await GameController.setActualActiveWorker(socket.roomId, p);
            await GameController.setActualNextWorker(socket.roomId, p);
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
