// let answersString: any = `
//
// 7.1 Пожары твердых горючих веществ и материалов классифицируются как:
// Пожары класса (A)
// Пожары класса (В)
// Пожары класса (С)
// Пожары класса (D)
// [DIVIDER]
// `;
//
// answersString = answersString.trim();
//
// answersString = answersString.split('[DIVIDER]');
//
// answersString = answersString.map((s: any) => {
//   let newArr = s.split('\n');
//   newArr = newArr
//     .map((s: any) => s.trim())
//     .filter((s: any) => s !== '');
//   return {
//     question: newArr[0],
//     answers: newArr.slice(1),
//     correctAnswer: '1',
//     categories: [17],
//   };
// });
// export default answersString;
