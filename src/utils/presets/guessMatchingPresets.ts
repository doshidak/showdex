import { type CalcdexPokemon, type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { dedupeArray } from '@showdex/utils/core';
import { detectGenFromFormat, detectLegacyGen } from '@showdex/utils/dex';
import { flattenAlts } from './flattenAlts';
import { findMatchingUsage } from './findMatchingUsage';

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
 * * Guaranteed to return an empty array.
 *
 * @since 1.1.3
 */
export const guessMatchingPresets = (
  presets: CalcdexPokemonPreset[],
  pokemon: CalcdexPokemon,
  config: {
    format: string;
    usages?: CalcdexPokemonPreset[];
  },
): CalcdexPokemonPreset[] => {
  const { format, usages } = { ...config };
  const gen = detectGenFromFormat(format);
  const legacy = detectLegacyGen(gen);

  if (!gen || !presets?.length || !pokemon?.speciesForme) {
    return [];
  }

  const {
    teraType: revealedTeraType,
    ability: revealedAbility,
    item: currentItem,
    prevItem,
    revealedMoves,
    transformedMoves,
    usageMoves,
  } = pokemon;

  const revealedItem = prevItem || currentItem;
  const revealedSourceMoves = transformedMoves?.length ? transformedMoves : (revealedMoves || []);
  const matchingUsage = findMatchingUsage(usages, { ...pokemon, moves: revealedSourceMoves });
  const guaranteedMoves = ((matchingUsage?.altMoves as typeof usageMoves) || usageMoves || []).filter((m) => m?.[1] === 1).map((m) => m[0]);
  const guessedMoves = dedupeArray([...revealedSourceMoves, ...guaranteedMoves]);

  return presets.filter((preset) => {
    const presetMoves = dedupeArray([...preset.moves, ...flattenAlts(preset.altMoves)]);
    const movesMatch = !!revealedSourceMoves.length && (
      /**
       * @todo update this when we support more than 4 moves
      */
      // if guessedMoves[].length > 4, then it probably wasn't it chief
      // (e.g., 2 Randoms role presets could share 2 of the same non-guaranteed moves that was revealed,
      // but have 3 unique 100% guaranteed ones)
      guessedMoves.length <= 4 && guessedMoves.every((m) => presetMoves.includes(m))
    );

    if (legacy) {
      return movesMatch;
    }

    const teraTypesMatch = !revealedTeraType || !preset.teraTypes?.length || preset.teraTypes.includes(revealedTeraType);
    const abilitiesMatch = !revealedAbility || [preset.ability, ...flattenAlts(preset.altAbilities)].includes(revealedAbility);
    const itemsMatch = !revealedItem || [preset.item, ...flattenAlts(preset.altItems)].includes(revealedItem);

    return teraTypesMatch && abilitiesMatch && itemsMatch && movesMatch;
  });
};
