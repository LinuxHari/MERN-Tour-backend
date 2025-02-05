export const getWeek = (date: Date): number => {
  const targetDate = new Date(date.getTime());
  targetDate.setHours(0, 0, 0, 0);

  targetDate.setDate(targetDate.getDate() + 3 - ((targetDate.getDay() + 6) % 7));

  const week1 = new Date(targetDate.getFullYear(), 0, 4);

  return (
    1 +
    Math.round(
      ((targetDate.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    )
  );
};
