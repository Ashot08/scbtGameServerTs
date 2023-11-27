export const isNextShift = (turns: any) => {

  if(Array.isArray(turns) && turns.length) {
    const lastTurn = turns.slice(-1)[0];
    const lastShift = lastTurn.shift;
    let lastShiftTurnsCount = 0;

    for (const turn of turns) {
      if(turn.shift === lastShift) {
        lastShiftTurnsCount += 1;
      }
    }

    if(lastShiftTurnsCount === 1) {
      return {status: true, message: 'Новая смена', shift: lastShift};
    }
    return {status: false, message: 'Смена еще идет', shift: lastShift};
  }

  return {status: false, message: 'Ошибка проверки смены'}
}
