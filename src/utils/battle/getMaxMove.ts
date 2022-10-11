import { PokemonDmaxMoves, PokemonDmaxAbilityMoves, PokemonGmaxMoves } from '@showdex/consts/pokemon';
import { formatId } from '@showdex/utils/app';
import { logger } from '@showdex/utils/debug';
import type { AbilityName, MoveName } from '@smogon/calc/dist/data/interface';
import { getDexForFormat } from './getDexForFormat';

const l = logger('@showdex/utils/app/getMaxMove');

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
  // dex: Generation,
  moveName: MoveName,
  abilityName?: AbilityName,
  speciesForme?: string,
  allowGmax?: boolean,
): MoveName => {
  const dex = getDexForFormat();

  if (!dex) {
    return null;
  }

  const move = dex.moves.get(moveName);

  if (!move?.exists) {
    if (__DEV__) {
      l.warn(
        'Provided moveName is not a valid move!',
        '\n', 'move', move,
        '\n', 'moveName', moveName,
        '\n', 'abilityName', abilityName,
        '\n', 'speciesForme', speciesForme,
        '\n', 'allowGmax?', allowGmax,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  if (move.category === 'Status') {
    return <MoveName> 'Max Guard';
  }

  const ability = abilityName ? dex.abilities.get(abilityName) : null;
  const abilityId = ability?.exists && ability.name ? formatId(ability.name) : null;

  if (abilityId === 'normalize') {
    return PokemonDmaxMoves.Normal;
  }

  // check for G-max moves
  if (speciesForme && (allowGmax || speciesForme.includes('-Gmax')) && PokemonGmaxMoves[move.type]) {
    const gmaxMoves = PokemonGmaxMoves[move.type];
    const speciesId = formatId(speciesForme);

    // e.g., if move.type is 'Water' and speciesId is 'urshifurapidstrikegmax', the 'urshifurapidstrike' key would match
    const matchedKey = Object.keys(gmaxMoves).find((k) => speciesId.includes(k));

    if (gmaxMoves[matchedKey]) {
      return gmaxMoves[matchedKey];
    }
  }

  // check for abilities that override the Normal typing
  if (move.type === 'Normal' && abilityId && PokemonDmaxAbilityMoves[abilityId]) {
    return PokemonDmaxAbilityMoves[abilityId];
  }

  return PokemonDmaxMoves[move.type];
};
