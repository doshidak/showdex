import {
  type AbilityName,
  type GenerationNum,
  type ItemName,
  type MoveName,
  type Weather,
} from '@smogon/calc';
import { PokemonDenormalizedMoves, PokemonMoveSkinAbilities } from '@showdex/consts/dex';
import { type CalcdexBattleField, type CalcdexPokemon } from '@showdex/interfaces/calc';
import { clamp } from '@showdex/utils/core';
import { detectGenFromFormat, detectGroundedness, getDexForFormat } from '@showdex/utils/dex';
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
  format: string | GenerationNum,
  pokemon: CalcdexPokemon,
  moveName: MoveName,
  config?: {
    opponentPokemon?: CalcdexPokemon;
    field?: CalcdexBattleField;
    overrides?: SmogonMoveOverrides;
  },
): number => {
  const dex = getDexForFormat(format);
  const gen = detectGenFromFormat(format);

  const {
    opponentPokemon,
    field,
    overrides,
  } = config || {};

  const {
    speciesForme,
    transformedForme,
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
    moveOverrides,
    volatiles: volatileMap,
  } = pokemon || {};

  const {
    exists: moveExists,
    name: dexMoveName,
    type: dexMoveType,
    basePower: dexBasePower,
    isZ,
    multihit,
  } = dex.moves.get(moveName) || {};

  const move = (moveExists && (dexMoveName as MoveName || moveName)) || null;
  const hiddenPowerMove = move?.startsWith('Hidden Power');

  let basePower = (
    hiddenPowerMove
      ? calcHiddenPower(format, pokemon)
      : (!!move && dexBasePower)
  ) || 0;

  // note: the BP returned for Beat Up here is for the current `pokemon` only!
  // the actual calculations are handled in `determineMoveStrikes()`, whose return value is then passed
  // into the modified `calculate()` function (from `@smogon/calc`) as the last argument
  // also note: in gens 2-4, Beat Up has a fixed BP of 10, so there's nothing to do here
  // also also note: I lied, actually this BP might be used in the event where there are no eligible allies
  // for Beat Up (including the attacker itself) in gens 5+, so only the attacker actually strikes with
  // the base power calculated & returned here! c:
  if (move === 'Beat Up' as MoveName && !basePower && gen > 4) { // basePower should be 0 in gens 5+
    const dexBaseAtk = transformedBaseStats?.atk ?? baseStats?.atk ?? 0;
    const baseAtk = dirtyBaseStats?.atk ?? dexBaseAtk;

    return Math.floor(baseAtk / 10) + 5;
  }

  // "you'd have to be a psychopath, right?" -analogcam, 2024
  // (note: these moves typically have 0 BP in their Dex entries, so this needs to come before the basePower check)
  if ((['Return', 'Frustration'] as MoveName[]).includes(move)) {
    // assumes max happiness for Return & 0 for Frustration, which is a safe assumption, apparently
    basePower = 102;
  }

  if (basePower < 1) {
    return 0;
  }

  const basePowerMods: number[] = [];

  const moveType = overrides?.type || dexMoveType;
  const moveHits = overrides?.hits
    || moveOverrides?.[move]?.hits
    || (Array.isArray(multihit) && multihit[0])
    || (typeof multihit === 'number' && multihit);

  const currentForme = transformedForme || speciesForme;
  const teraType = dirtyTeraType || revealedTeraType;
  const ability = dirtyAbility || revealedAbility;
  const item = dirtyItem ?? revealedItem;
  const hitCounter = clamp(0, currentHitCounter || 0);
  const faintCounter = clamp(0, dirtyFaintCounter ?? (currentFaintCounter || 0));
  const volatiles = Object.keys(volatileMap || {});

  if (move === 'Water Shuriken' as MoveName) {
    basePower = currentForme === 'Greninja-Ash' && ability === 'Battle Bond' as AbilityName ? 20 : 15;
  }

  // perform the same BP math hacks that @smogon/calc does for Triple Axel & Triple Kick
  if (move === 'Triple Axel' as MoveName) {
    basePower = moveHits === 2 ? 30 : moveHits === 3 ? 40 : 20;
  }

  if (move === 'Triple Kick' as MoveName) {
    basePower = moveHits === 2 ? 15 : moveHits === 3 ? 30 : 10;
  }

  if (move === 'Rage Fist' as MoveName && hitCounter > 0) {
    basePower = clamp(0, basePower * (1 + hitCounter), 350);
  }

  if (move === 'Last Respects' as MoveName && faintCounter > 0) {
    basePower = clamp(0, basePower * (1 + faintCounter), 5050);
  }

  // Tera Blast becomes 100 BP when Terastallized to the Stellar type
  if (move === 'Tera Blast' as MoveName && teraType === 'Stellar' && terastallized) {
    basePower = 100;
  }

  if (Object.keys(PokemonMoveSkinAbilities).includes(ability)) {
    // 4 of the 5 skinning abilities modify any Normal type moves, while the last one, Normalize, modifies all moves to
    // become Normal type, which is what you'd expect... just kinda annoying to implement lmao
    if (moveType === 'Normal') {
      // these abilities were introduced in gen 6
      if ((['Aerilate', 'Pixilate', 'Refrigerate'] as AbilityName[]).includes(ability) && gen > 5) {
        // note: in gen 6 (X/Y), it's a 30% boost; after in gens 7+, it got nerfed to 20%
        // update (2024/01/04): in the gen56 mechanics file, this is a bpMod, so a lil accuracy loss here potentially
        // (actually in my testing, discrepancy must be real smol)
        basePowerMods.push(gen > 6 ? 1.2 : 1.3);
      }

      // Galvanize was introduced in gen 7
      if (ability === 'Galvanize' as AbilityName && gen > 6) {
        basePowerMods.push(1.2);
      }
    }

    // tho Normalize was introduced in gen 4, as far as this function's concerned, we only care about the gens that have
    // the 20% boost (even applies to originally Normal moves), which wasn't a thing until gens 7+
    const shouldBoostNormalize = ability === 'Normalize' as AbilityName
      && gen > 6 // hence this check (following the comment above)
      && !hiddenPowerMove
      && !isZ
      && !PokemonDenormalizedMoves.includes(move);

    if (shouldBoostNormalize) {
      basePowerMods.push(1.2);
    }
  }

  // according to the Bulbapedia (as of 2023/12/29):
  // "During any type of weather except strong winds, Weather Ball's power doubles to 100."
  if (move === 'Weather Ball' as MoveName) {
    const shouldApplyBoost = (field?.weather && field.weather !== 'Strong Winds')
      && (item !== 'Utility Umbrella' as ItemName || !([
        'Harsh Sunshine',
        'Heavy Rain',
        'Rain',
        'Sun',
      ] as Weather[]).includes(field.weather));

    if (shouldApplyBoost) {
      basePowerMods.push(2); // could do this, as long as basePower is 50 from the dex o_O
      // basePower = 100; // fuck it yolo
    }
  }

  if (move === 'Terrain Pulse' as MoveName && field?.terrain && detectGroundedness(pokemon, field)) {
    // with the Mega Launcher ability, they gain a 50% boost for Pulse moves
    if (ability === 'Mega Launcher' as AbilityName) {
      basePowerMods.push(1.5); // e.g., basePower = 50 -> 75
    }

    basePowerMods.push(2); // e.g., w/ Mega Launcher = 150; w/o = 100
  }

  // note: had to manually disable the auto-boost in @smogon/calc (specifically in the gen56 & gen789 mechanics files),
  // which is included in this project's @smogon/calc patch
  // update (2023/11/06): this needs to be applied BEFORE the Tera STAB boost oops
  if (move === 'Acrobatics' as MoveName && (!item || item === 'Flying Gem' as ItemName)) {
    basePowerMods.push(2);
  }

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
    basePower = basePowerMods.reduce((bp, mod) => Math.floor(bp * clamp(0, mod)), basePower);
  }

  // update (2023/04/17): though @smogon/calc natively implements this now,
  // leaving this logic here to show the boosted BP in the move's tooltip;
  // also, this mechanic comes AFTER any boosts from Rage Fist/Last Respects
  // (verified from the Showdown server source code)
  if (shouldBoostTeraStab(format, pokemon, move, basePower)) {
    basePower = 60;
  }

  return basePower;
};
