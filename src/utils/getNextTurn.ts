export function getNextTurn(lastTurnPlayerId: number = 0, players: any, turns: any) {
  let nextShift = 1;
  let playerId = 0;
  let newPlayerIndex = 0;
  const coefficient = (turns.length + 1) / players.length;

  // find next player

  for (let i = 0; i < players.length; i += 1) {
    if (+players[i] === +lastTurnPlayerId) {
      newPlayerIndex = i + 1;
    }
  }

  if (newPlayerIndex === players.length) {
    newPlayerIndex = 0;
  }

  playerId = players[newPlayerIndex];

  // calculate shift

  for (let i = 0; i < 99; i += 1) {
    if (coefficient > i) {
      nextShift = i + 1;
    }
  }

  return { playerId, nextShift };
}
