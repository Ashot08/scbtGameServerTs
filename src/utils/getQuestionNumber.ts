export const getQuestionNumber = (answers: any) => {
  let number = Math.floor(Math.random() * 180);
  let counter = 0;

  if (Array.isArray(answers) && answers.length) {
    // eslint-disable-next-line no-loop-func
    while (counter < 500000 && answers.find((a: any) => a.question_id === number)) {
      number = Math.floor(Math.random() * 180);
      counter += 1;
    }
  }

  return number;
};
