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
    prizeNumber = 0;
  } else if (randomNumber <= 0.20) {
    prizeNumber = 1;
  } else if (randomNumber <= 0.31) {
    prizeNumber = 2;
  } else if (randomNumber <= 0.46) {
    prizeNumber = 3;
    // Летальный НС
  } else if (randomNumber <= 53) {
    prizeNumber = 4;
  } else if (randomNumber <= 70) {
    // Легкий НС
    prizeNumber = 5;
  } else if (randomNumber <= 0.85) {
    // Групповой НС
    prizeNumber = 6;
  } else {
    // Микротравма
    prizeNumber = 7;
  }

  return prizeNumber;
};
