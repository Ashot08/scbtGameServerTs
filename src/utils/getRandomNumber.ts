export const getRandomNumber = () => {
  // const odds = [
  //   5,
  //   15,
  //   11,
  //   15,
  //   7,
  //   17,
  //   15,
  //   15
  // ]
  const randomNumber = Math.ceil(Math.random() * 100);
  let prizeNumber = 0;
  if (randomNumber <= 5) {
    // Групповой летальный
    prizeNumber = 0;
  } else if (randomNumber <= 20) {
    // Бонус
    prizeNumber = 1;
  } else if (randomNumber <= 31) {
    // Тяжелый
    prizeNumber = 2;
  } else if (randomNumber <= 46) {
    // Микротравма
    prizeNumber = 3;
  } else if (randomNumber <= 53) {
    // Летальный НС
    prizeNumber = 4;
  } else if (randomNumber <= 70) {
    // Легкий НС
    prizeNumber = 5;
  } else if (randomNumber <= 85) {
    // Групповой НС
    prizeNumber = 6;
  } else {
    // Микротравма
    prizeNumber = 7;
  }

  return prizeNumber;
};
