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
export const getNewWorkersPositionsScheme = (playerState: any, workerIndex: number) => {
  const workersPositionsArray = playerState.workers_positions_scheme.split(',');
  workersPositionsArray[workerIndex] = 1;
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

export const getAccidentDifficultlyByPrizeNumber = (prizeNumber: number | undefined) => {
  if (!prizeNumber) {
    prizeNumber = 1;
  }
  const accidentDifficultly = ['6 + 1', '0', '4', '1', '5', '2', '3 + 1', '1'];
  return accidentDifficultly[prizeNumber];
};
