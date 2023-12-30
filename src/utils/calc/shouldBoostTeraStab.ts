import { type GenerationNum, type MoveName } from '@smogon/calc';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { formatId } from '@showdex/utils/core';
import { getDexForFormat } from '@showdex/utils/dex';
import { calcHiddenPower } from './calcHiddenPower';

/**
 * Whether the Terastallized STAB move's BP should be boosted to 60.
 *
 * * If the BP is dynamically determined (e.g., *Last Respects*) or is overwritten,
 *   specify it as the `basePowerOverride` argument to prevent this from returning `true`.
 *
 * @since 1.1.2
 */
export const shouldBoostTeraStab = (
  format: string | GenerationNum,
  pokemon: CalcdexPokemon,
  moveName: MoveName,
  basePowerOverride?: number,
): boolean => {
  const dex = getDexForFormat(format);
  const move = dex.moves.get(moveName);
  const teraType = pokemon?.dirtyTeraType || pokemon?.teraType;

  if (!move?.exists || !teraType) {
    return false;
  }

  const moveId = move.id || formatId(moveName);

  const basePower = basePowerOverride || (
    moveId.startsWith('hiddenpower')
      ? calcHiddenPower(format, pokemon)
      : move.basePower || 0
  );

  const abilityId = formatId(pokemon.dirtyAbility || pokemon.ability);
  const hasTechnician = abilityId === 'technician';

  return pokemon.terastallized
    && move.type === teraType
    && basePower < 60
    && (!hasTechnician || Math.floor(basePower * 1.5) < 60)
    && !move.multihit
    && !move.priority;
};
