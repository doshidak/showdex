export const upsizeArray = <T = unknown>(
  array: T[],
  size: number,
  fill?: T,
  slice?: boolean,
): T[] => {
  if (Array.isArray(array) && array.length >= size) {
    return slice && array.length > size ? array.slice(0, size) : array;
  }

  const upsized = $.extend(true, [] as T[], array).filter(Boolean);
  const upsizeCount = Math.max(size - upsized.length, 0);

  if (upsizeCount > 0) {
    return upsized.concat(Array<T>(upsizeCount).fill(fill || null));
  }

  return upsized;
};
