let answersString: any = `
10.51 Как называется документ, в котором указаны все пути и выходы из здания?
План эвакуации
План побега
План «Б»
Просто план
[DIVIDER]
10. 52 Как называется прибор для измерения параметров освещения?
Люксметр 
Светоскоп
Светомер
Тонометр
[DIVIDER]
`;

answersString = answersString.trim();

answersString = answersString.split('[DIVIDER]');

answersString = answersString.map((s: any) => {
  let newArr = s.split('\n');
  newArr = newArr
    .map((s: any) => s.trim())
    .filter((s: any) => s !== '');
  return {
    question: newArr[0],
    answers: newArr.slice(1),
    correctAnswer: '1',
    categories: [18],
  };
});
// export default answersString;
