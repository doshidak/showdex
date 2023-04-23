import { formatId } from '@showdex/utils/app';
import { calcHiddenPower } from '@showdex/utils/calc';
import type { MoveName } from '@smogon/calc/dist/data/interface';
import type { CalcdexPokemon } from '@showdex/redux/store';
import { getDexForFormat } from './getDexForFormat';

/**
 * Whether the Terastallized STAB move's BP should be boosted to 60.
 *
 * * If the BP is dynamically determined (e.g., *Last Respects*) or is overwritten,
 *   specify it as the `basePowerOverride` argument to prevent this from returning `true`.
 *
 * @since 1.1.2
 */
export const shouldBoostTeraStab = (
  format: string,
  pokemon: CalcdexPokemon,
  moveName: MoveName,
  basePowerOverride?: number,
): boolean => {
  const dex = getDexForFormat(format);
  const move = dex.moves.get(moveName);

  if (!move?.exists || !pokemon?.teraType) {
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
    && move.type === pokemon.teraType
    && basePower < 60
    && (!hasTechnician || Math.floor(basePower * 1.5) < 60)
    && !move.multihit
    && !move.priority;
};
