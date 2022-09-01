export const formatStatBoost = (boostedStat: number): string => {
  if (typeof boostedStat !== 'number') {
    return '';
  }

  // otherwise, something like '50.400000000000006' can get rendered lol
  const isFloat = /\.\d+$/.test(boostedStat.toString());

  return boostedStat.toFixed(isFloat ? 1 : 0);
};
