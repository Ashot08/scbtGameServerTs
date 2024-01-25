export const getWorkersOnPositionsCount = (playerState: any) => {
  const workersPositionsArray = playerState.workers_positions_scheme.split(',');
  let count = 0;
  for (const w of workersPositionsArray) {
    if(w === 1 || w === '1') {
      count += 1;
    }
  }
  return count;
}
export const getNewWorkersPositionsScheme = (playerState: any, workerIndex: number) => {
  const workersPositionsArray = playerState.workers_positions_scheme.split(',');
  workersPositionsArray[workerIndex] = 1;
  return workersPositionsArray.join(',');
}

export const getNewNotActiveDefendsScheme = (playerState: any, workerIndex: number, addedDefendsCount: number) => {
  const addedDefendsArray = playerState.not_active_defends_scheme.split(',');
  addedDefendsArray[workerIndex] =  +addedDefendsArray[workerIndex] + addedDefendsCount;

  if (addedDefendsArray[workerIndex] <= 6) {
    return addedDefendsArray.join(',');
  }

  return 6;
}

export const isAllPlayersReady = (playersState: any) => {
  let allPlayersReady = true;
  if(Array.isArray(playersState) && playersState.length) {
    for (const p of playersState) {
      if (p.ready === 'false') allPlayersReady = false;
    }
  } else {
    allPlayersReady = false;
  }

  return allPlayersReady;
}
