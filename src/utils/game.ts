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
