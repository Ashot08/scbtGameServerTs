export const getActivePlayer = (game: any) => {
  if(game) {
    if(Array.isArray(game.turns) && Array.isArray(game.players) && game.turns.length && game.players.length) {
      const lastTurn = getLastTurn(game.turns);
      return game.players.find((el: any) => {return el.id === lastTurn.player_id});
    }
    if(Array.isArray(game.turns) && Array.isArray(game.players) && game.players.length) {
      return game.players[0];
    }
  }
  return {name: '-'};
}

export const getLastTurn = (turns: any) => {
  return turns.slice(-1)[0];
}
