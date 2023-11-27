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

  // const result = answers.map((a: any) => a.question_id).sort((a: number, b: number) => a - b);
  // const newResult: any = {};
  // for(let i = 30; i < result.length; i++) {
  //   if(newResult[result[i]]) {
  //     newResult[result[i]] += 1;
  //   } else {
  //     newResult[result[i]] = 1;
  //   }
  // }
  // console.log('counter', newResult);

  return number;
};
