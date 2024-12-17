type DateParam = string | Date;

const getDuration = (startDate: DateParam, endDate: DateParam) => {
  return Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
};

export default getDuration;
