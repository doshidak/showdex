export const upsizeArray = <T = unknown>(
  array: T[],
  size: number,
  fill?: T,
): T[] => {
  if (Array.isArray(array) && array.length >= size) {
    return array;
  }

  const upsized = array || [];
  const upsizeCount = Math.max(size - upsized.length, 0);

  if (upsizeCount > 0) {
    return upsized.concat(Array<T>(upsizeCount).fill(fill || null));
  }

  return upsized;
};
