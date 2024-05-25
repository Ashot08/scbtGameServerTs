import { QuestionCatOptions } from '../db/models/Question.ts';
import { questions } from '../constants/questions.ts';

export const getQuestionNumber = (answers: any, gameQuestionCats: QuestionCatOptions []) => {
  const utilizedQuestionsIndexes: number[] = [];
  const questionsIndexes: number[] = [];
  const allQuestions: any = questions.questions;

  if (Array.isArray(answers)) {
    for (const answer of answers) {
      utilizedQuestionsIndexes.push(answer.question_id);
    }
  }



  // Фильтруем
  if (Array.isArray(allQuestions)) {
    const hasCats = Array.isArray(gameQuestionCats) && gameQuestionCats.length;
    for (let i = 0; i < allQuestions.length; i += 1) {
      let filterByCatPassed = false;
      if (hasCats) {
        for (const cat of gameQuestionCats) {
          if (allQuestions[i].categories.includes(cat.id)) {
            filterByCatPassed = true;
          }
        }
      }
      if (filterByCatPassed && !utilizedQuestionsIndexes.includes(i)) {
        questionsIndexes.push(i);
      }
    }
  }

  // Если в результате фильтрации нет ни одного доступного вопроса, фильтруем заново, учитывая только категории
  if (!questionsIndexes.length) {
    const hasCats = Array.isArray(gameQuestionCats) && gameQuestionCats.length;
    for (let i = 0; i < allQuestions.length; i += 1) {
      let filterByCatPassed = false;
      if (hasCats) {
        for (const cat of gameQuestionCats) {
          if (allQuestions[i].categories.includes(cat.id)) {
            filterByCatPassed = true;
          }
        }
      }
      if (filterByCatPassed) {
        questionsIndexes.push(i);
      }
    }
  }

  // Если всё равно нет ни одного доступного вопроса
  if (!questionsIndexes.length) {
    for (let i = 0; i < allQuestions.length; i += 1) {
      questionsIndexes.push(i);
    }
  }

  // console.log('questionsIndexes', questionsIndexes);

  const numberIndex = Math.floor(Math.random() * questionsIndexes.length);
  return questionsIndexes[numberIndex];
};
