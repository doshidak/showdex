import { formatId } from '@showdex/utils/app';
import { getDexForFormat } from '@showdex/utils/battle';
import { clamp } from '@showdex/utils/core';
import type { MoveName } from '@smogon/calc/dist/data/interface';
import type { CalcdexPokemon } from '@showdex/redux/store';
import type { SmogonMoveOverrides } from './createSmogonMove';
import { calcHiddenPower } from './calcHiddenPower';

/**
 * Calculates the base power of the provided `moveName` based on conditions of the `pokemon`.
 *
 * * Also handles *Hidden Power* via `calcHiddenPower()` too!
 * * If no effects exist for the `moveName`, its reported `basePower` from the `dex` will be returned.
 * * Note that for your safety, `overrides.basePower`, while accepted by the `SmogonMoveOverrides` typing,
 *   will NOT override the `basePower` used in this utility.
 *   - Supplied `basePower` value is from the internal `dex`.
 *   - You should use the `overrides.basePower` value OR the return value from this utility.
 *   - (Didn't omit the `'basePower'` key from `SmogonMoveOverrides` to minimize wrestling the types lol.)
 *
 * @since 1.1.0
 */
export const calcMoveBasePower = (
  format: string,
  pokemon: CalcdexPokemon,
  moveName: MoveName,
  opponentPokemon?: CalcdexPokemon,
  overrides?: SmogonMoveOverrides,
): number => {
  const dex = getDexForFormat(format);

  const move = dex.moves.get(moveName);
  const moveId = move.id || formatId(moveName);

  let basePower = moveId.startsWith('hiddenpower')
    ? calcHiddenPower(format, pokemon)
    : (move?.exists && move.basePower) || 0;

  if (basePower < 1) {
    return 0;
  }

  const hitCounter = clamp(0, pokemon?.hitCounter || 0);
  const faintCounter = clamp(0, pokemon?.faintCounter || 0);

  if (moveId === 'ragefist' && hitCounter > 0) {
    basePower = clamp(0, basePower * (1 + hitCounter), 350);
  }

  if (moveId === 'lastrespects' && faintCounter > 0) {
    basePower = clamp(0, basePower * (1 + faintCounter), 5050);
  }

  const basePowerMods: number[] = [];
  const abilityId = formatId(pokemon?.dirtyAbility || pokemon?.ability);

  if (['electromorphosis', 'windpower'].includes(abilityId) && 'charge' in (pokemon?.volatiles || {})) {
    const moveType = overrides?.type || move.type;

    if (moveType === 'Electric') {
      basePowerMods.push(2);
    }
  }

  if (abilityId === 'supremeoverlord' && faintCounter > 0) {
    basePowerMods.push(1 + (0.1 * faintCounter));
  }

  if (formatId(opponentPokemon?.lastMove) === 'glaiverush') {
    basePowerMods.push(2);
  }

  if (basePowerMods.length) {
    return basePowerMods.reduce((bp, mod) => Math.floor(bp * clamp(0, mod)), basePower);
  }

  return basePower;
};
