import { PokemonPresetFuckedFormes } from '@showdex/consts/pokemon';
import { formatId } from '@showdex/utils/app';
import type { GenerationNum } from '@smogon/calc';
import { getDexForFormat } from './getDexForFormat';

/**
 * Returns an array of species formes that `speciesForme`s in `CalcdexPokemonPreset`s should match
 * for the given `speciesForme`.
 *
 * * Guaranteed to at least return an empty array (i.e., `[]`) if building the formes fails at any point.
 *
 * @example
 * ```ts
 * getPresetFormes('Necrozma-Ultra');
 *
 * // hmm... should we return 'Necrozma-Dusk-Mane' as well?
 * // ... probably not, yolo
 * [
 *   'Necrozma-Ultra',
 *   'Necrozma-Dawn-Wings',
 * ]
 * ```
 * @example
 * ```ts
 * // note: formatAsId arg is true here; take note of the output
 * getPresetFormes('Gengar', 'gen8randombattle', true);
 *
 * [
 *   'gengar',
 *   'gengargmax',
 * ]
 * ```
 * @since 1.1.2
 */
export const getPresetFormes = (
  speciesForme: string,
  format?: GenerationNum | string,
  formatAsId?: boolean,
): string[] => {
  // this will be our final return value
  const output: string[] = [];

  if (!speciesForme) {
    return output;
  }

  const dex = getDexForFormat(format);
  const dexSpecies = dex.species.get(speciesForme);

  if (!dexSpecies?.exists) {
    return output;
  }

  // e.g., 'Necrozma-Ultra' (typically wouldn't have any sets)
  output.push(dexSpecies.name);

  const { baseSpecies: baseForme } = dexSpecies; // e.g., 'Necrozma'
  const checkBaseForme = !!baseForme && baseForme !== dexSpecies.name;

  const battleFormes = (
    Array.isArray(dexSpecies.battleOnly)
      ? dexSpecies.battleOnly // e.g., ['Necrozma-Dawn-Wings', 'Necrozma-Dusk-Mane']
      : [dexSpecies.battleOnly]
  ).filter(Boolean); // e.g., (for some other Pokemon) 'Darmanitan-Galar' -> ['Darmanitan-Galar']

  if (battleFormes.length) {
    // e.g., 'Necrozma-Dawn-Wings' (sets would typically match this forme)
    const fuckedBattleForme = battleFormes.find((f) => PokemonPresetFuckedFormes.includes(f));

    if (fuckedBattleForme) {
      output.push(fuckedBattleForme);
    }
  } else if (checkBaseForme && PokemonPresetFuckedFormes.includes(baseForme)) {
    // e.g., 'Necrozma' (though for this specific Pokemon, wouldn't apply since it has battleFormes)
    output.push(baseForme);
  }

  // see if we should add the Gmax forme as well, if any
  if (dexSpecies.canGigantamax) {
    const dexGigantamax = dex.species.get(`${dexSpecies.name}-Gmax`);

    if (dexGigantamax?.exists) {
      // e.g., (for some other Pokemon) 'Gengar-Gmax'
      output.push(dexGigantamax.name);
    }
  }

  // remove duplicate formes with this one simple trick (programmers hate him)
  const nonDupesOutput = Array.from(new Set(output.filter(Boolean)));

  if (formatAsId) {
    return nonDupesOutput.map((f) => formatId(f));
  }

  return nonDupesOutput;
};
