import { type AbilityName } from '@smogon/calc';
import { type CalcdexPokemon, type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { replaceBehemothMoves } from '@showdex/utils/battle';
import { dedupeArray } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { detectGenFromFormat, detectLegacyGen, getGenfulFormat } from '@showdex/utils/dex';
import { flattenAlts } from './flattenAlts';
import { findMatchingUsage } from './findMatchingUsage';

const l = logger('@showdex/utils/presets/guessMatchingPresets()');

/**
 * Attempts to find matching presets based on what's been revealed for the `pokemon` in battle.
 *
 * * Matched presets are based on the following conditions:
 *   - Revealed Tera type (if any in gen 9) matches the preset's `teraTypes[]`,
 *   - Revealed ability (if any in a non-legacy gen) matches the preset's `ability` or `altAbilities[]`,
 *   - Revealed item (if any in a non-legacy gen) matches the preset's `item` or `altItems[]`, &
 *   - All revealed moves (if any) match the preset's `moves[]` or `altMoves[]`.
 * * Matching doesn't take into account user-provided dirty properties, only battle-reported ones.
 * * Assumes that `presets[]` have already been pre-filtered for the `pokemon`'s current forme!
 *   - Otherwise, use the `selectPokemonPresets()` utility from `@showdex/utils/presets` to perform the filtering for you.
 * * When `config.formatOnly` is `true`, only presets matching the provided `config.format` will be returned.
 * * Guaranteed to return an empty array.
 *
 * @since 1.1.3
 */
export const guessMatchingPresets = (
  presets: CalcdexPokemonPreset[],
  pokemon: CalcdexPokemon,
  config: {
    format: string;
    formatOnly?: boolean;
    usages?: CalcdexPokemonPreset[];
  },
): CalcdexPokemonPreset[] => {
  const { format, formatOnly, usages } = { ...config };
  const gen = detectGenFromFormat(format);
  const legacy = detectLegacyGen(gen);

  if (!gen || !presets?.length || !pokemon?.speciesForme) {
    return [];
  }

  const {
    speciesForme,
    transformedForme,
    teraType: revealedTeraType,
    ability: revealedAbility,
    item: currentItem,
    prevItem,
    revealedMoves,
    transformedMoves,
    usageMoves, // might be stale (i.e., these could be of the currently applied preset if called in the midst of applying another one!)
  } = pokemon;

  const currentForme = transformedForme || speciesForme;
  const revealedItem = prevItem || currentItem;
  const revealedSourceMoves = transformedMoves?.length ? transformedMoves : (revealedMoves || []);

  // note: don't use altMoves[] since there's a special length check for Randoms
  // const matchingUsage = findMatchingUsage(usages, { ...pokemon, moves: revealedSourceMoves });
  // const guaranteedMoves = ((matchingUsage?.altMoves as typeof usageMoves) || usageMoves || []).filter((m) => m?.[1] === 1).map((m) => m[0]);
  // const guessedMoves = replaceBehemothMoves(currentForme, dedupeArray([...revealedSourceMoves, ...guaranteedMoves]));

  l.debug(
    'Attempting to guess presets for', pokemon?.ident || pokemon?.speciesForme,
    '\n', 'revealedItem', revealedItem,
    '\n', 'revealedSourceMoves[]', '->', transformedMoves?.length ? 'transformedMoves[]' : 'revealedMoves[]', revealedSourceMoves,
    // '\n', 'matchingUsage', matchingUsage,
    // '\n', 'guaranteedMoves[]', guaranteedMoves,
    // '\n', 'guessedMoves[]', guessedMoves,
  );

  return presets.filter((preset) => {
    const matchingUsage = findMatchingUsage(usages, preset);
    const guaranteedMoves = ((matchingUsage?.altMoves as typeof usageMoves) || usageMoves || []).filter((m) => m?.[1] === 1).map((m) => m[0]);
    const guessedMoves = replaceBehemothMoves(preset.speciesForme, dedupeArray([...revealedSourceMoves, ...guaranteedMoves]));
    const presetMoves = replaceBehemothMoves(preset.speciesForme, dedupeArray([...preset.moves, ...flattenAlts(preset.altMoves)]));

    const movesMatch = !!revealedSourceMoves.length
      /**
       * @todo update this when we support more than 4 moves
       */
      // if guessedMoves[].length > 4, then it probably wasn't it chief
      // (e.g., 2 Randoms role presets could share 2 of the same non-guaranteed moves that was revealed,
      // but have 3 unique 100% guaranteed ones)
      && guessedMoves.length <= 4
      && revealedSourceMoves.every((m) => presetMoves.includes(m));

    if (legacy) {
      return movesMatch;
    }

    const formatsMatch = !formatOnly || getGenfulFormat(preset.gen, preset.format) === format;

    const teraTypesMatch = !revealedTeraType
      || !preset.teraTypes?.length
      || preset.teraTypes.includes(revealedTeraType);

    const abilitiesMatch = !revealedAbility
      || (currentForme.startsWith('Terapagos') && preset.speciesForme === 'Terapagos' && preset.ability === 'Tera Shift' as AbilityName)
      || [preset.ability, ...flattenAlts(preset.altAbilities)].includes(revealedAbility);

    const itemsMatch = !revealedItem || [preset.item, ...flattenAlts(preset.altItems)].includes(revealedItem);

    l.debug(
      'Result for preset', preset.calcdexId, preset.name, 'for', preset.speciesForme,
      '\n', 'formatsMatch?', formatsMatch,
      '\n', 'teraTypesMatch?', teraTypesMatch,
      '\n', 'abilitiesMatch?', abilitiesMatch,
      '\n', 'itemsMatch?', itemsMatch,
      '\n', 'movesMatch?', movesMatch,
      '\n', 'matchingUsage', matchingUsage,
      '\n', 'guaranteedMoves[]', guaranteedMoves,
      '\n', 'guessedMoves[]', guessedMoves,
      '\n', 'presetMoves[]', presetMoves,
      '\n', 'preset', preset,
      '\n', 'pokemon', pokemon,
    );

    return formatsMatch && teraTypesMatch && abilitiesMatch && itemsMatch && movesMatch;
  });
};
