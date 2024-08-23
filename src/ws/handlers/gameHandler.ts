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
  getActiveDefendsCount, getNextWorkerIndex,
  getNotActiveDefendsCount, getWorkersOnPositionsCount,
  isAllPlayersReady,
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
        const accidentDifficultlyNumber = parseInt(accidentDifficultly, 10);
        const userId = result.result?.lastTurn.player_id;
        const playerState = await GameController.getPlayerState(socket.roomId, userId);
        const activeDefends = getActiveDefendsCount(playerState, playerState.active_worker);
        const notActiveDefends = getNotActiveDefendsCount(playerState, playerState.active_worker);
        const nextWorkerIndex = +getNextWorkerIndex(playerState, playerState.active_worker);
        const nextWorkerActiveDefends = +getActiveDefendsCount(playerState, nextWorkerIndex);

        // refresh
        await GameController.updatePlayerNextWorkerMode(socket.roomId, playerState.player_id, 'false');
        await GameController.updateNextWorkerQuestionsCount(socket.roomId, playerState.player_id, 0);
        await GameController.updateQuestionsToActivateDef(playerState.player_id, socket.roomId, 0);
        await GameController.updateQuestionsWithoutDef(playerState.player_id, socket.roomId, 0);
        await Game.updateNoMoreRolls(playerState.player_id, socket.roomId, 'false');
        if (nextWorkerIndex <= playerState.active_worker) {
          await Game.updateNoMoreRolls(playerState.player_id, socket.roomId, 'true');
        }

        // update
        await Game.updateAccidentDiff(playerState.player_id, socket.roomId, accidentDifficultlyNumber);

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
            if ((getWorkersOnPositionsCount(playerState) > 1) && (nextWorkerActiveDefends === 0)) {
              // если рабочий один, или акт защит больше 0, то группового НС нет
              await GameController.updatePlayerNextWorkerMode(socket.roomId, playerState.player_id, 'true');
              await GameController.updateNextWorkerQuestionsCount(socket.roomId, playerState.player_id, 1);
            }
          default:
            // Травма
            if (activeDefends >= accidentDifficultlyNumber) {
              // Exit
            } else {
              await GameController.updateQuestionsToActivateDef(playerState.player_id, socket.roomId, notActiveDefends);
              await GameController.updateQuestionsWithoutDef(
                playerState.player_id,
                socket.roomId,
                accidentDifficultlyNumber - activeDefends,
              );
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
        await GameController.updateShowRollResultMode(socket.roomId, 'false');
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

  async function goNextWorker(data: any) {
    try {
      const playerState = await GameController.getPlayerState(socket.roomId, data.activePlayerId);
      const result = await GameController.goNextWorker(socket.roomId, playerState);
      await GameController.updateShowRollResultMode(socket.roomId, 'false');
      if (result.status === 'success') {
        const gameState = await GameController.getState(socket.roomId);
        io.to(socket.roomId).emit('game:updateState', gameState);
      }
    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'goNextWorker Error' });
    }
  }

  async function deletePlayer(data: any) {
    try {
      const gameState = await GameController.getState(socket.roomId);

      if(gameState?.state?.players === undefined) {
        throw new TypeError('players is not an Array');
      }
      const newOrder = gameState.state.game.players_order.split(',').filter((pId: any) => +pId !== +data.id).join();
      if(Array.isArray(gameState?.state?.players)) {
        const player = gameState?.state?.players.filter((p)=> p.id == data.id)[0];
        if(gameState.state.players.length > 2) {
          const result = await GameController.deletePlayerFromGame(socket.roomId, data.id);
          if (result.status === 'success') {
            await  GameController.deleteTurn(socket.roomId, data.id);
            await GameController.updatePlayersCount(socket.roomId);
            await GameController.updateGamePlayersOrder(newOrder, socket.roomId);
            if(data.nextTurn) {
              await GameController.createTurnOnDeletePlayer(socket.roomId);
            }
            const gameState = await GameController.getState(socket.roomId);
            io.to(socket.roomId).emit('game:updateState', gameState);

            io.to(socket.roomId).emit(
              'notification',
              { status: 'success', message: `Игрок ${player.name ? player.name : player.username} удален` }
            );
          }
        } else {
          socket.emit('notification', { status: 'error', message: `Игрок ${player.name ? player.name : player.username} не удален. Игроков всего 2` });
        }
      } else {
        throw new TypeError('players is not an Array');
      }

    } catch (e) {
      socket.emit('notification', { status: 'error', message: 'deletePlayer Error' });
    }
  }

  async function addDefendsFromBrigadier(data: any) {
    const playerState = await GameController.getPlayerState(socket.roomId, data.activePlayerId);
    const oldPlayerDefendsCount = playerState.brigadier_defends_count;
    if(oldPlayerDefendsCount > 0) {
      await GameController.addActiveDefend(socket.roomId, playerState, data.workerIndex);
      await GameController.updatePlayerBrigadierDefendsCount(playerState.player_id, socket.roomId, oldPlayerDefendsCount - 1);

      // Если ход игрока
      if(data.activePlayerId === playerState.player_id) {
        if(playerState.next_worker_index === data.workerIndex) {
          const questionsToNextWorkerCount = playerState.questions_to_next_worker_count;
          await GameController.updateNextWorkerQuestionsCount(
            socket.roomId,
            playerState.player_id,
            questionsToNextWorkerCount - 1,
          );
        }

        if (playerState.active_worker === data.workerIndex) {
          const activeDefendsCount = +getActiveDefendsCount(playerState, playerState.active_worker);
          const questionsWithoutDefCount = playerState.questions_without_def_count;
          const questionsToActivateDefCount = playerState.questions_to_active_def_count;
          // уменьшить на 1 количество вопросов "Без защит (без права на ошибку)",
          await GameController.updateQuestionsWithoutDef(
            playerState.player_id,
            socket.roomId,
            questionsWithoutDefCount - 1,
          );

          // если активных защит стало достаточно
          if ((activeDefendsCount + 1 >= playerState.accident_difficultly)) {
            await GameController.updateQuestionsToActivateDef(
              playerState.player_id,
              socket.roomId,
              0,
            );
            // socket.emit('game:workerSaved', { status: 'Спасен' });
          }

          // уменьшить количество вопросов для неактивных защит, если нужно
          if (questionsToActivateDefCount + activeDefendsCount + 1 >= 6) {
            await GameController.updateQuestionsToActivateDef(
              playerState.player_id,
              socket.roomId,
              questionsToActivateDefCount - 1,
            );
          }
        }
      }

      const gameState = await GameController.getState(socket.roomId);
      socket.emit('game:updateState', gameState);
    }
  }
  async function updatePlayersOrder(data: any) {
    try {
      const result = await GameController.updateGamePlayersOrder(data.order, socket.roomId, true);
      if(result.status === 'success') {
        await GameController.deleteAllTurns(socket.roomId);
        await GameController.createTurn(socket.roomId);
        // console.log(createTurnResult);
        const gameState = await GameController.getState(socket.roomId);
        io.to(socket.roomId).emit('game:updateState', gameState);
        io.to(socket.roomId).emit(
          'notification',
          { status: 'success', message: `Очередность игроков изменена` }
        );
      }
    } catch (e: any) {
      socket.emit('notification', { status: 'error', message: 'updatePlayersOrder Error' });
    }
  }

  async function onModeratorClickStartBrigadierSection() {
    try {
      const time = Date.now().toString();
      const result = await GameController.updateStartTime(socket.roomId, time);
      if(result.status === 'success') {
        await GameController.updateBrigadierStage('in_process', socket.roomId);
        const gameState = await GameController.getState(socket.roomId);
        io.to(socket.roomId).emit('game:updateState', gameState);
        io.to(socket.roomId).emit(
          'notification',
          { status: 'success', message: `Старт!` }
        );
      }
    } catch (e: any) {
      socket.emit('notification', { status: 'error', message: 'updateStartTime Error' });
    }
  }

  function sendChatNotification(data: any){
    io.to(socket.roomId).emit(
      'notification',
      { status: 'success', message: `${data.text}` }
    );
  }

  socket.on('game:join', joinGame);
  socket.on('game:getState', getState);
  socket.on('game:create_roll', roll);
  socket.on('game:create_turn', createTurn);
  socket.on('game:stop_game', stopGame);
  socket.on('game:update_worker_data', updateWorkerData);
  socket.on('game:buy_defends', buyDefends);
  socket.on('game:change_ready_status', changeReadyStatus);
  socket.on('game:go_next_worker', goNextWorker);
  socket.on('game:delete_player', deletePlayer);
  socket.on('game:moderator_notification', sendChatNotification);
  socket.on('game:add_defend_from_brigadier', addDefendsFromBrigadier);
  socket.on('game:update_players_order', updatePlayersOrder);
  socket.on('game:moderator_click_start_brigadier_section', onModeratorClickStartBrigadierSection);
};
