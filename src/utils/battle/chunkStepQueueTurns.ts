/**
 * Steps to ignore during the `stepQueue[]` chunking process.
 *
 * * Must be an exact match.
 *   - ...for now.
 *   - (inb4 something makes me have to do some special partial search so fuuhh should've made this into a regex lmaoo)
 *
 * @since 1.2.0
 */
const IgnoredSteps: string[] = [
  '|',
  '|upkeep',
];

/**
 * Chunks the provided `stepQueue[]` by turn numbers, which corresponds to the index in the returned array.
 *
 * * Note that this does **not** parse the actual steps themselves, but simply groups them together by turn.
 *   - Turns are marked by the turn step, e.g., `'|turn|1'`.
 * * Should no steps be parsed for a particular turn,  an empty array will be present at that index at the very least.
 * * Chunk at index `0` will primarily consist of battle initialization steps, e.g., `'|gametype|singles'`.
 * * Guaranteed to return an empty array.
 *
 * @since 1.2.0
 */
export const chunkStepQueueTurns = (
  stepQueue: string[],
): string[][] => {
  if (!stepQueue?.length) {
    return [];
  }

  const output: string[][] = [];

  stepQueue.forEach((step) => {
    if (!output.length || step?.startsWith('|turn|')) {
      output.push([]);
    }

    if (!step || IgnoredSteps.includes(step)) {
      return;
    }

    output[output.length - 1].push(step);
  });

  return output;
};
