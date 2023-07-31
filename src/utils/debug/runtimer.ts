import { type LoggerLevelFunctions, logger as createLogger } from './logger';

/**
 * Runtime performance timer.
 *
 * * Useful if you want to know how long something takes to execute.
 * * Call the function that this returns to mark the end time & begin measuring.
 *   - You'd typically call this right before you `return` from the function.
 *   - Execution time will be logged to the console.
 *   - Any arguments optionally provided will be appended to the same console log.
 *   - For more advanced purposes, this function returns the `PerformanceMeasure`.
 * * Note that this is a no-op in production.
 * * Also a no-op if the `performance` global isn't available.
 * * Optionally provide a `logger` instance to *slightly* reduce this timer's memory footprint.
 *   - Might be important to minimize the timer's impact on the resulting execution time! :o
 *   - Pro-tip: You can pass in `logger.scope` for the `scope` argument (if it works in your case).
 *
 * @example
 * ```ts
 * import { runtimer } from '@showdex/utils/debug';
 *
 * const someFunction = (...args) => {
 *   const endTimer = runtimer('@showdex/some/path:someFunction()');
 *
 *   // ... implementation ... //
 *
 *   endTimer(
 *     'optional additional console logs to append like someResult:',
 *     someResult,
 *   );
 *
 *   return someResult;
 * };
 * ```
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Performance
 * @since 1.1.6
 */
export const runtimer = (
  scope: string,
  logger?: LoggerLevelFunctions,
): ((...args: unknown[]) => PerformanceMeasure) => {
  if (!__DEV__ || typeof performance?.mark !== 'function' || !scope) {
    return () => null;
  }

  const l = logger || createLogger(scope);
  const startMark = performance.mark(`${scope}:start`);

  return (...args) => {
    if (!__DEV__) {
      l.warn('not today satan');
      performance.clearMarks(startMark.name);

      return null;
    }

    const endMark = performance.mark(`${scope}:end`);

    if (!startMark?.name || !endMark?.name) {
      l.error(
        'Performance marker names for', scope || '???', 'are missing! wtf',
        '\n', 'startMark', startMark?.name, startMark,
        '\n', 'endMark', endMark?.name, endMark,
      );

      return null;
    }

    try {
      const measurement = performance.measure(`${scope}:measure`, startMark.name, endMark.name);
      const { duration = -420.69 } = measurement;

      // note: no point in going beyond 1 sig fig for `duration` (hundreths+ digits are 0's)
      l.info(
        scope || '???', 'took', duration.toFixed(1), 'ms',
        // 'to execute',
        // '\n', 'execution performance rating (by SPE):',
        // duration >= 875 ? 'shuckle' : duration >= 500 ? 'regigigas' : duration >= 125 ? 'scarf tran' : 'regieleki',
        // ...(args.length ? ['\n', ...args] : []),
        ...args,
      );

      return measurement;
    } catch (error) {
      l.error('Couldn\'t measure execution time for', scope || '???', 'due to', error);

      // attempt to clean up existing markers
      try {
        performance.clearMarks(startMark.name);
        performance.clearMarks(endMark.name);
      } catch (clearError) {
        l.warn('Couldn\'t clean up performance markers for', scope || '???', 'due to', clearError);
      }

      throw error;
    }
  };
};
