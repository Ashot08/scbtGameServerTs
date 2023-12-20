import { QuestionCatOptions } from '../db/models/Question.ts';
import { questions } from '../constants/questions.ts';

export const getQuestionNumber = (answers: any, gameQuestionCats: QuestionCatOptions []) => {
  let number = Math.floor(Math.random() * questions.questions.length);
  let counter = 0;
  let gameCatsIds: any = [];
  let availableCat = false;

  if (Array.isArray(gameQuestionCats) && gameQuestionCats.length) {
    gameCatsIds = gameQuestionCats.map((c) => c.id);
  } else {
    availableCat = true;
  }
  if (Array.isArray(answers)) {
    while (
      (
        counter < 500000
        // eslint-disable-next-line no-loop-func
          && (answers.find((a: any) => a.question_id === number))
      )
        || !availableCat
    ) {
      number = Math.floor(Math.random() * questions.questions.length);
      availableCat = false;
      if (gameCatsIds.length) {
        for (const cat of gameCatsIds) {
          if (questions.questions[number].categories.includes(cat as number)) {
            availableCat = true;
          }
        }
      }

      counter += 1;
    }
  }

  return number;
};
