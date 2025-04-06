type DateParam = string | Date;

const getDuration = (startDate: DateParam, endDate: DateParam) =>
  Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;

export default getDuration;
