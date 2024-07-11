import { QuestionOptions } from '../db/models/Question.ts';
import { DbAnswer } from '../typings/types.ts';

export const getQuestionNumber = (questions: QuestionOptions[], answers: DbAnswer[]) => {
  const exceptedAnswersIds: number[] = [];
  const questionsIndexes: number[] = [];
  if (Array.isArray(answers)) {
    for (const answer of answers) {
      exceptedAnswersIds.push(answer.question_id);
    }
  }
  const questionsFilteredByIdsUsedBefore = questions.filter(
    (question: QuestionOptions) => !exceptedAnswersIds.includes(question.id as number),
  );
  if (questionsFilteredByIdsUsedBefore.length) {
    questions = questionsFilteredByIdsUsedBefore;
  }
  for (let i = 0; i < questions.length; i += 1) {
    questionsIndexes.push(questions[i].id as number);
  }
  const numberIndex = Math.floor(Math.random() * questionsIndexes.length);
  return questionsIndexes[numberIndex];
};
