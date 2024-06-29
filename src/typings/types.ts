export type DbAnswer = {
  id: number,
  turn_id: number,
  game_id: number,
  player_id: number,
  roll_id: number,
  question_id: number,
  is_active_player_question: string,
  status: string,
  start_time: string,
  end_time: string
}

export enum AnswerCorrect {
  True = 'true',
  False = 'false',
}

