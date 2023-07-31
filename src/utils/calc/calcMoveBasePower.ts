import { type MoveName } from '@smogon/calc';
import { type CalcdexPokemon } from '@showdex/redux/store';
import { clamp, formatId } from '@showdex/utils/core';
import { detectGenFromFormat, getDexForFormat } from '@showdex/utils/dex';
import { calcHiddenPower } from './calcHiddenPower';
import { type SmogonMoveOverrides } from './createSmogonMove';
import { shouldBoostTeraStab } from './shouldBoostTeraStab';

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
  const gen = detectGenFromFormat(format);

  const move = dex.moves.get(moveName);
  const moveId = move.id || formatId(moveName);

  let basePower = moveId.startsWith('hiddenpower')
    ? calcHiddenPower(format, pokemon)
    : (move?.exists && move.basePower) || 0;

  // note: the BP returned for Beat Up here is for the current `pokemon` only!
  // the actual calculations are handled in `determineMoveStrikes()`, whose return value is then passed
  // into the modified `calculate()` function (from `@smogon/calc`) as the last argument
  // also note: in gens 2-4, Beat Up has a fixed BP of 10, so there's nothing to do here
  // also also note: I lied, actually this BP might be used in the event where there are no eligible allies
  // for Beat Up (including the attacker itself) in gens 5+, so only the attacker actually strikes with
  // the base power calculated & returned here! c:
  if (moveId === 'beatup' && !basePower && gen > 4) { // basePower should be 0 in gens 5+
    const {
      baseStats,
      dirtyBaseStats,
      transformedBaseStats,
    } = pokemon || {};

    const dexBaseAtk = transformedBaseStats?.atk ?? baseStats?.atk ?? 0;
    const baseAtk = dirtyBaseStats?.atk ?? dexBaseAtk;

    return Math.floor(baseAtk / 10) + 5;
  }

  if (basePower < 1) {
    return 0;
  }

  const abilityId = formatId(pokemon?.dirtyAbility || pokemon?.ability);

  const hitCounter = clamp(0, pokemon?.hitCounter || 0);
  const faintCounter = clamp(0, pokemon?.dirtyFaintCounter ?? (pokemon?.faintCounter || 0));

  if (moveId === 'ragefist' && hitCounter > 0) {
    basePower = clamp(0, basePower * (1 + hitCounter), 350);
  }

  if (moveId === 'lastrespects' && faintCounter > 0) {
    basePower = clamp(0, basePower * (1 + faintCounter), 5050);
  }

  // update (2023/04/17): though @smogon/calc natively implements this now,
  // leaving this logic here to show the boosted BP in the move's tooltip;
  // also, this mechanic comes AFTER any boosts from Rage Fist/Last Respects
  // (verified from the Showdown server source code)
  const boostTeraStab = shouldBoostTeraStab(format, pokemon, moveName, basePower);

  if (boostTeraStab) {
    basePower = 60;
  }

  const basePowerMods: number[] = [];

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
