import { JoinGameOptions } from '../../db/models/Game.ts';
import GameController, {
  BuyDefendsData,
  ChangeReadyStatusData,
  UpdateWorkerData,
} from '../../controllers/GameController.ts';
import { isNextShift } from '../../utils/isNextShift.ts';
import { getActivePlayer } from '../../utils/getActivePlayer.ts';
import { getAccidentDifficultlyByPrizeNumber, isAllPlayersReady } from '../../utils/game.ts';

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

        const accidentDifficultly = getAccidentDifficultlyByPrizeNumber(result.result?.prizeNumber);
        const userId = result.result?.lastTurn.player_id;
        const playerState = await GameController.getPlayerState(socket.roomId, userId);

        switch (accidentDifficultly) {
          case '0':
            // Бонус
            // updateAccidentDiff
            // updateQuestionsToActivateDef
            // updateQuestionsWithoutDef
            // updateDefendsCount
            // updateActiveWorker
            await GameController.onRollBonus(socket.roomId, playerState);
            break;

          case '1':
            // Микро
            // updateAccidentDiff

            // проверяем активные >= AccidentDiff
            // если больше то
              // updateQuestionsToActivateDef = 0 [1]
              // updateQuestionsWithoutDef = 0
              // updateActiveWorker
              // updateNextWorker
            // иначе
              // если есть неактивные
                // updateQuestionsToActivateDef = число неактивных защит на этой клетке
                // отвечаем пока не наберем 1 защиту или defends < 1
                // отвечаем пока не наберем 1 защиту defends-- updateDefends--
                  // если набрал выходим в [1]
              // updateQuestionsWithoutDef = 1
                // отвечаем, если ошибка
                  // Штраф 1 монета, если есть,
                // Если верно
                  // Ничего
              // updateQuestionsToActivateDef = 0 [1]
              // updateQuestionsWithoutDef = 0
              // updateActiveWorker
              // updateNextWorker
              // Выход


            // updateQuestionsWithoutDef

            // После ответов updateActiveWorker

            break;

          case '2':
            // Микро

            break;

          case '4':
            // Травма

            break;

          case '5':
            // Травма

            break;

          case '3 + 1':
            // Групповой

            break;

          case '6 + 1':
            // Групповой

            break;

          default:

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
