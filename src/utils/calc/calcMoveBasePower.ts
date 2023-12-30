import { type AbilityName, type MoveName } from '@smogon/calc';
import { PokemonDenormalizedMoves, PokemonMoveSkinAbilities } from '@showdex/consts/dex';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { clamp } from '@showdex/utils/core';
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

  const {
    teraType: revealedTeraType,
    dirtyTeraType,
    terastallized,
    ability: revealedAbility,
    dirtyAbility,
    item: revealedItem,
    dirtyItem,
    baseStats,
    dirtyBaseStats,
    transformedBaseStats,
    hitCounter: currentHitCounter,
    faintCounter: currentFaintCounter,
    dirtyFaintCounter,
    volatiles,
  } = pokemon || {};

  const move = dex.moves.get(moveName);
  const hiddenPowerMove = moveName?.startsWith('Hidden Power');

  let basePower = (
    hiddenPowerMove
      ? calcHiddenPower(format, pokemon)
      : (move?.exists && move.basePower)
  ) || 0;

  // note: the BP returned for Beat Up here is for the current `pokemon` only!
  // the actual calculations are handled in `determineMoveStrikes()`, whose return value is then passed
  // into the modified `calculate()` function (from `@smogon/calc`) as the last argument
  // also note: in gens 2-4, Beat Up has a fixed BP of 10, so there's nothing to do here
  // also also note: I lied, actually this BP might be used in the event where there are no eligible allies
  // for Beat Up (including the attacker itself) in gens 5+, so only the attacker actually strikes with
  // the base power calculated & returned here! c:
  if (moveName === 'Beat Up' as MoveName && !basePower && gen > 4) { // basePower should be 0 in gens 5+
    const dexBaseAtk = transformedBaseStats?.atk ?? baseStats?.atk ?? 0;
    const baseAtk = dirtyBaseStats?.atk ?? dexBaseAtk;

    return Math.floor(baseAtk / 10) + 5;
  }

  if (basePower < 1) {
    return 0;
  }

  // note: dirtyItem can be set to an empty string (i.e., '') to "clear" the item
  const moveType = overrides?.type || move.type;
  const teraType = dirtyTeraType || revealedTeraType;
  const ability = dirtyAbility || revealedAbility;
  const item = dirtyItem ?? revealedItem;
  const hitCounter = clamp(0, currentHitCounter || 0);
  const faintCounter = clamp(0, dirtyFaintCounter ?? (currentFaintCounter || 0));

  if (Object.keys(PokemonMoveSkinAbilities).includes(ability)) {
    // 4 of the 5 skinning abilities modify any Normal type moves, while the last one, Normalize, modifies all moves to
    // become Normal type, which is what you'd expect... just kinda annoying to implement lmao
    if (moveType === 'Normal') {
      // these abilities were introduced in gen 6
      if ((['Aerilate', 'Pixilate', 'Refrigerate'] as AbilityName[]).includes(ability) && gen > 5) {
        // note: in gen 6 (X/Y), it's a 30% boost; after in gens 7+, it got nerfed to 20%
        basePower *= gen > 6 ? 1.2 : 1.3;
      }

      // Galvanize was introduced in gen 7
      if (ability === 'Galvanize' as AbilityName && gen > 6) {
        basePower *= 1.2;
      }
    }

    // tho Normalize was introduced in gen 4, as far as this function's concerned, we only care about the gens that have
    // the 20% boost (even applies to originally Normal moves), which wasn't a thing until gens 7+
    const shouldBoostNormalize = ability === 'Normalize' as AbilityName
      && gen > 6 // hence this check (following the comment above)
      && !hiddenPowerMove
      && !move.isZ
      && !PokemonDenormalizedMoves.includes(moveName);

    if (shouldBoostNormalize) {
      basePower *= 1.2;
    }
  }

  if (moveName === 'Rage Fist' as MoveName && hitCounter > 0) {
    basePower = clamp(0, basePower * (1 + hitCounter), 350);
  }

  if (moveName === 'Last Respects' as MoveName && faintCounter > 0) {
    basePower = clamp(0, basePower * (1 + faintCounter), 5050);
  }

  // note: had to manually disable the auto-boost in @smogon/calc (specifically in the gen56 & gen789 mechanics files),
  // which is included in this project's @smogon/calc patch
  // update (2023/11/06): this needs to be applied BEFORE the Tera STAB boost oops
  if (moveName === 'Acrobatics' as MoveName && !item) {
    basePower *= 2;
  }

  // update (2023/04/17): though @smogon/calc natively implements this now,
  // leaving this logic here to show the boosted BP in the move's tooltip;
  // also, this mechanic comes AFTER any boosts from Rage Fist/Last Respects
  // (verified from the Showdown server source code)
  if (shouldBoostTeraStab(format, pokemon, moveName, basePower)) {
    basePower = 60;
  }

  // Tera Blast becomes 100 BP when Terastallized to the Stellar type
  if (moveName === 'Tera Blast' as MoveName && teraType === 'Stellar' && terastallized) {
    basePower = 100;
  }

  const basePowerMods: number[] = [];

  if ((['Electromorphosis', 'Wind Power'] as AbilityName[]).includes(ability) && 'charge' in (volatiles || {}) && moveType === 'Electric') {
    basePowerMods.push(2);
  }

  if (ability === 'Supreme Overlord' as AbilityName && faintCounter > 0) {
    basePowerMods.push(1 + (0.1 * faintCounter));
  }

  if (opponentPokemon?.lastMove === 'Glaive Rush' as MoveName) {
    basePowerMods.push(2);
  }

  if (basePowerMods.length) {
    return basePowerMods.reduce((bp, mod) => Math.floor(bp * clamp(0, mod)), basePower);
  }

  return basePower;
};
