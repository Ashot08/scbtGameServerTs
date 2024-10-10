export const getWorkersOnPositionsCount = (playerState: any) => {
  const workersPositionsArray = playerState.workers_positions_scheme.split(',');
  let count = 0;
  for (const w of workersPositionsArray) {
    if (w === 1 || w === '1') {
      count += 1;
    }
  }
  return count;
};
export const getNewWorkersPositionsScheme = (playerState: any, workerIndex: number, remove = false) => {
  const workersPositionsArray = playerState.workers_positions_scheme.split(',');
  if (remove) {
    workersPositionsArray[workerIndex] = 0;
  } else {
    workersPositionsArray[workerIndex] = 1;
  }
  return workersPositionsArray.join(',');
};

export const getNewNotActiveDefendsScheme = (
  playerState: any,
  workerIndex: number,
  addedDefendsCount: number,
) => {
  const addedDefendsArray = playerState.not_active_defends_scheme.split(',');
  addedDefendsArray[workerIndex] = +addedDefendsArray[workerIndex] + addedDefendsCount;

  if (addedDefendsArray[workerIndex] > 6) {
    addedDefendsArray[workerIndex] = 6;
  }
  if (addedDefendsArray[workerIndex] < 0) {
    addedDefendsArray[workerIndex] = 0;
  }
  return addedDefendsArray.join(',');
};

export const getNewActiveDefendsScheme = (
  playerState: any,
  workerIndex: number,
  addedDefendsCount: number,
) => {
  const addedDefendsArray = playerState.active_defends_scheme.split(',');
  addedDefendsArray[workerIndex] = +addedDefendsArray[workerIndex] + addedDefendsCount;

  if (addedDefendsArray[workerIndex] > 6) {
    addedDefendsArray[workerIndex] = 6;
  }
  if (addedDefendsArray[workerIndex] < 0) {
    addedDefendsArray[workerIndex] = 0;
  }
  return addedDefendsArray.join(',');
};

export const isAllPlayersReady = (playersState: any) => {
  let allPlayersReady = true;
  if (Array.isArray(playersState) && playersState.length) {
    for (const p of playersState) {
      if (p.ready === 'false') allPlayersReady = false;
    }
  } else {
    allPlayersReady = false;
  }

  return allPlayersReady;
};

export const getWorkersPositionsFirstIndex = (playerState: any) => {
  const workersPositionsArray = playerState.workers_positions_scheme.split(',');
  let activeWorkerPosition = 0;
  for (let i = 0; i < 6; i += 1) {
    if (workersPositionsArray[i] === 1 || workersPositionsArray[i] === '1') {
      activeWorkerPosition = i;
      break;
    }
  }
  return activeWorkerPosition;
};

export const getNextWorkerIndex = (playerState: any, activeWorkerIndex: number) => {
  const workersPositionsArray = playerState.workers_positions_scheme.split(',');
  let nextWorkerIndex = 0;
  for (let i = activeWorkerIndex + 1; i < 6; i += 1) {
    if (workersPositionsArray[i] === 1 || workersPositionsArray[i] === '1') {
      nextWorkerIndex = i;
      break;
    }
  }

  if (!nextWorkerIndex) {
    for (let i = 0; i < activeWorkerIndex; i += 1) {
      if (workersPositionsArray[i] === 1 || workersPositionsArray[i] === '1') {
        nextWorkerIndex = i;
        break;
      }
    }
  }

  return nextWorkerIndex;
};

export const isGamePlayersOrderCorrect = (game: any, playersArray: any, order: string) => {
  const correctIds = playersArray.map((player: any) => player.id).sort().join() === order.split(',').sort().join();
  return (game.players_count === order.split(',').length) && correctIds;
};

export const getAccidentDifficultlyByPrizeNumber = (prizeNumber: number | undefined) => {
  if (prizeNumber === undefined) {
    prizeNumber = 1;
  }
  const accidentDifficultly = ['6 + 1', '0', '4', '1', '5', '2', '3 + 1', '1'];
  return accidentDifficultly[prizeNumber];
};

export const getActiveDefendsCount = (
  playerState: any,
  workerIndex: number,
) => {
  const activeDefendsArray = playerState.active_defends_scheme.split(',');
  return +activeDefendsArray[workerIndex];
};

export const getNotActiveDefendsCount = (
  playerState: any,
  workerIndex: number,
) => {
  const notActiveDefendsArray = playerState.not_active_defends_scheme.split(',');
  return +notActiveDefendsArray[workerIndex];
};
