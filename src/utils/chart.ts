export const calculateZeroInclusiveYAxisDomain = ([dataMin, dataMax]: [
  number,
  number,
]): [number, number] => {
  return [dataMin < 0 ? dataMin : 0, dataMax > 0 ? dataMax : 0];
};
