import { type CalcdexPokemonPreset, type CalcdexPokemonPresetSource } from '@showdex/interfaces/calc';
// import { logger } from '@showdex/utils/debug';
import { PokePasteLineParsers, importPokePaste } from './importPokePaste';

// const l = logger('@showdex/utils/presets/importMultiPokePastes()');

const maybeSpeciesForme = (
  line: string,
) => Object.entries(PokePasteLineParsers).every(([k, r]) => k === 'speciesForme' || !r.test(line));

/**
 * Imports multiple sets contained within the provided `pokePastes` into `CalcdexPokemonPreset[]`'s.
 *
 * * Each Pokemon is deliminated by the `speciesForme` line.
 *   - Everything following this line will pertain to that Pokemon.
 *   - Next set will be generated on the next `speciesForme` line.
 *   - This means that the `pokePastes` is somewhat expected to be in order since we can no longer assume 1 Pokemon here.
 * * Guaranteed to return an empty array.
 *
 * @since 1.2.3
 */
export const importMultiPokePastes = (
  pokePastes: string,
  format?: string,
  name = 'Import',
  source: CalcdexPokemonPresetSource = 'import',
): CalcdexPokemonPreset[] => {
  const output: CalcdexPokemonPreset[] = [];

  if (!pokePastes) {
    return output;
  }

  // determine where the "speciesForme" lines are
  const lines = pokePastes.split(/\r?\n/).filter(Boolean).map((line) => line.trim());
  const startIndices = lines
    .map((line, i) => maybeSpeciesForme(line) && i)
    .filter((i) => typeof i === 'number' && i > -1);

  if (!startIndices.length) {
    return output;
  }

  const chunks = startIndices.reduce((prev, startIndex, i) => {
    const nextIndex = startIndices[i + 1] ?? lines.length;
    const chunk = lines.slice(startIndex, nextIndex); // start = inclusive, end = exclusive

    if (!chunk.length) {
      return prev;
    }

    prev.push(chunk.join('\n'));

    return prev;
  }, [] as string[]);

  if (!chunks.length) {
    return output;
  }

  chunks.forEach((chunk) => {
    const preset = importPokePaste(chunk, format, name, source);

    if (!preset?.speciesForme) {
      return;
    }

    output.push(preset);
  });

  return output;
};
