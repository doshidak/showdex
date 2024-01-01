import { type AbilityName, type MoveName } from '@smogon/calc';
import { PokemonDmaxAbilityMoves, PokemonDmaxMoves, PokemonGmaxMoves } from '@showdex/consts/dex';
import { getDexForFormat } from './getDexForFormat';

/**
 * Returns the corresponding Max/G-Max move for a given move.
 *
 * * If `allowGmax` is `true`, any matching G-max move will be returned regardless of the `'-Gmax'` suffix in the `speciesForme`.
 * * Otherwise, this requires the `'-Gmax'` suffix in the passed-in `speciesForme` to distinguish between D-max and G-max moves!
 *   - e.g., `'Alcremie-Gmax'` should be passed in for the `speciesForme` argument, not just `'Alcremie'`.
 * * As of v1.2.0, similar to `getZMove()`, you can provide the optional `config.moveType` to specify a dynamic type.
 *   - This is also for moves like *Weather Ball* & *Terrain Pulse*.
 *
 * @see https://github.com/smogon/damage-calc/blob/bdf9e8c39fec7670ed0ce64e1fb58d1a4dc83b73/calc/src/move.ts#L242
 * @since 0.1.2
 */
export const getMaxMove = (
  moveName: MoveName,
  config?: {
    moveType?: Showdown.TypeName;
    speciesForme?: string;
    allowGmax?: boolean;
    ability?: AbilityName;
  },
): MoveName => {
  const dex = getDexForFormat();
  const dexMove = dex?.moves.get(moveName);

  if (!dexMove?.exists) {
    return null;
  }

  const {
    category: moveCategory,
    type: dexMoveType,
  } = dexMove;

  if (moveCategory === 'Status') {
    return 'Max Guard' as MoveName;
  }

  const {
    moveType: configMoveType,
    speciesForme,
    allowGmax,
    ability: abilityName,
  } = config || {};

  const moveType = configMoveType || dexMoveType;

  const {
    exists: abilityExists,
    name: dexAbilityName,
  } = dex.abilities.get(abilityName) || {};

  const ability = (abilityExists && (dexAbilityName as AbilityName || abilityName)) || null;

  const hasAbilityMove = !!ability
    && !!PokemonDmaxAbilityMoves[ability]
    && (ability === 'Normalize' as AbilityName || moveType === 'Normal');

  if (hasAbilityMove) {
    return PokemonDmaxAbilityMoves[ability];
  }

  // check for G-max moves
  const gmaxMove = (
    !!speciesForme
      && (allowGmax || speciesForme.includes('-Gmax'))
      && PokemonGmaxMoves[moveType]?.[speciesForme.replace('-Gmax', '')]
  ) || null;

  if (gmaxMove) {
    return gmaxMove;
  }

  return PokemonDmaxMoves[moveType];
};
