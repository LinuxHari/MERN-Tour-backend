export const isValidDate = (date: string) => date === new Date(date).toISOString().split("T")[0];
export const parseToInt = (value: string) => parseInt(value);
export const strToArr = (values: string) => {
  const valueArr = values.split(",");
  if (valueArr.length) return valueArr;
  return [values];
};
