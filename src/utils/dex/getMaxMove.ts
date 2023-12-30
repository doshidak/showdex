import { type AbilityName, type MoveName } from '@smogon/calc';
import { PokemonDmaxAbilityMoves, PokemonDmaxMoves, PokemonGmaxMoves } from '@showdex/consts/dex';
import { formatId } from '@showdex/utils/core';
import { getDexForFormat } from './getDexForFormat';

/**
 * Returns the corresponding Max/G-Max move for a given move.
 *
 * * If `allowGmax` is `true`, any matching G-max move will be returned regardless of the `'-Gmax'` suffix in the `speciesForme`.
 * * Otherwise, this requires the `'-Gmax'` suffix in the passed-in `speciesForme` to distinguish between D-max and G-max moves!
 *   - e.g., `'Alcremie-Gmax'` should be passed in for the `speciesForme` argument, not just `'Alcremie'`.
 *
 * @see https://github.com/smogon/damage-calc/blob/bdf9e8c39fec7670ed0ce64e1fb58d1a4dc83b73/calc/src/move.ts#L242
 * @since 0.1.2
 */
export const getMaxMove = (
  moveName: MoveName,
  abilityName?: AbilityName,
  speciesForme?: string,
  allowGmax?: boolean,
): MoveName => {
  const dex = getDexForFormat();
  const dexMove = dex?.moves.get(moveName);

  if (!dexMove?.exists) {
    return null;
  }

  const {
    category: moveCategory,
    type: moveType,
  } = dexMove;

  if (moveCategory === 'Status') {
    return 'Max Guard' as MoveName;
  }

  const dexAbility = dex.abilities.get(abilityName);
  const ability = (dexAbility?.exists && dexAbility.name as AbilityName) || null;

  const hasAbilityMove = !!ability
    && !!PokemonDmaxAbilityMoves[ability]
    && (ability === 'Normalize' as AbilityName || moveType === 'Normal');

  if (hasAbilityMove) {
    return PokemonDmaxAbilityMoves[ability];
  }

  // check for G-max moves
  if (speciesForme && (allowGmax || speciesForme.includes('-Gmax')) && PokemonGmaxMoves[moveType]) {
    const gmaxMoves = PokemonGmaxMoves[moveType];
    const speciesId = formatId(speciesForme);

    // e.g., if move.type is 'Water' and speciesId is 'urshifurapidstrikegmax', the 'urshifurapidstrike' key would match
    const matchedKey = Object.keys(gmaxMoves).find((k) => speciesId.includes(k));

    if (gmaxMoves[matchedKey]) {
      return gmaxMoves[matchedKey];
    }
  }

  return PokemonDmaxMoves[moveType];
};
