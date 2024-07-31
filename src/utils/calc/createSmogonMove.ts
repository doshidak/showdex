import { type AbilityName, type MoveName, Move as SmogonMove } from '@smogon/calc';
import { MOVES } from '@smogon/calc/dist/data/moves';
import { type CalcdexBattleField, type CalcdexMoveOverride, type CalcdexPokemon } from '@showdex/interfaces/calc';
import { clamp } from '@showdex/utils/core';
import {
  detectGenFromFormat,
  determineCriticalHit,
  determineMoveTargets,
  getGenDexForFormat,
} from '@showdex/utils/dex';
import { calcMoveBasePower } from './calcMoveBasePower';
import { getMoveOverrideDefaults } from './getMoveOverrideDefaults';
import { shouldBoostTeraStab } from './shouldBoostTeraStab';

/**
 * Overrides for `SmogonMove`.
 *
 * * Note that `SmogonMove` internally uses `bp` for base power, but looks for `basePower` from the `dex` or `overrides`.
 *
 * @see https://github.com/smogon/damage-calc/blob/efa6fe7c9d9f8415ea0d1bab17f95d7bcfbf617f/calc/src/move.ts#L116
 * @since 1.0.6
 */
export type SmogonMoveOverrides = Omit<Partial<InstanceType<typeof SmogonMove>>, 'bp'> & {
  basePower?: number;
};

export const createSmogonMove = (
  format: string,
  pokemon: CalcdexPokemon,
  moveName: MoveName,
  opponentPokemon: CalcdexPokemon,
  field?: CalcdexBattleField,
): [move: SmogonMove, overrides: CalcdexMoveOverride] => {
  // using the Dex global for the gen arg of SmogonMove seems to work here lol
  const dex = getGenDexForFormat(format);
  const gen = detectGenFromFormat(format);

  if (!dex || !gen || !pokemon?.speciesForme || !moveName) {
    return null;
  }

  const {
    speciesForme,
    teraType: revealedTeraType,
    dirtyTeraType,
    terastallized,
    ability: revealedAbility,
    dirtyAbility,
    item: revealedItem,
    dirtyItem,
    stellarMoveMap,
    moveOverrides,
    useZ,
    useMax,
  } = pokemon;

  const teraType = dirtyTeraType || revealedTeraType;
  const ability = dirtyAbility || revealedAbility;
  const item = dirtyItem ?? revealedItem;

  const options: ConstructorParameters<typeof SmogonMove>[2] = {
    species: speciesForme,
    ability,
    item,

    // only apply one of them, not both!
    useZ: useZ && !useMax,
    useMax,
    // isStellarFirstUse: false, // note: populated below

    // for moves that always crit, we need to make sure the crit doesn't apply when Z/Max'd
    isCrit: determineCriticalHit(pokemon, moveName, { format }),
  };

  const defaultOverrides = getMoveOverrideDefaults(format, pokemon, moveName, opponentPokemon, field);
  const overrides: SmogonMoveOverrides = { ...determineMoveTargets(format, pokemon, moveName) };

  // update (2024/07/20): need access to drain[] for result.recovery(), but the Showdown dex doesn't have it :c
  // (tho Showdown's & Smogon's dexes both provide recoil[] in the same format: [numerator: number, denominator: number] to form the damage ratio)
  // fortunately for us, we're already bundling all move data that comes with @smogon/calc, so why not make use of it? LOL
  const smogonMoveData = MOVES[gen][moveName];

  if (Array.isArray(smogonMoveData?.drain)) {
    overrides.drain = [...smogonMoveData.drain];
  }

  // check if the user specified any overrides for this move
  const calcdexOverrides: CalcdexMoveOverride = { ...defaultOverrides, ...moveOverrides?.[moveName] };
  const {
    type: typeOverride,
    category: categoryOverride,
    basePower: basePowerOverride,
    zBasePower: zBasePowerOverride,
    maxBasePower: maxBasePowerOverride,
    alwaysCriticalHits: criticalHitOverride,
    hits: hitsOverride,
    stellar: stellarOverride,
    defensiveStat: defensiveStatOverride,
    offensiveStat: offensiveStatOverride,
  } = calcdexOverrides;

  // pretty much only used for Beat Up (which is typeless in gens 2-4)
  const forceTypeless = moveName === 'Beat Up' as MoveName && gen < 5;

  if (forceTypeless || typeOverride) {
    overrides.type = forceTypeless ? '???' : typeOverride;
  }

  if (categoryOverride) {
    overrides.category = categoryOverride;
  }

  const overrodeBasePower = typeof basePowerOverride === 'number';

  overrides.basePower = overrodeBasePower
    ? clamp(0, basePowerOverride)
    : calcMoveBasePower(format, pokemon, moveName, {
      opponentPokemon,
      field,
      overrides,
    });

  // update (2023/01/02): @smogon/calc added an alliesFainted property to their Pokemon class,
  // so no need to manually provide that functionality now; specified in createSmogonPokemon()
  // (also, didn't remove it from calcMoveBasePower() since we still want to show the actual BP in the UI)
  const removeBasePowerOverride = overrides.basePower < 1 || (
    !overrodeBasePower && (
      ability === 'Supreme Overlord' as AbilityName
        || shouldBoostTeraStab(format, pokemon, moveName, overrides.basePower)
    )
  );

  if (removeBasePowerOverride) {
    delete overrides.basePower;
  }

  // only supply this if it's true (otherwise, use the pre-determined value)
  if (criticalHitOverride) {
    options.isCrit = criticalHitOverride;
  }

  if (hitsOverride) {
    options.hits = hitsOverride;

    if (!Array.isArray(calcdexOverrides.hitBasePowers)) {
      calcdexOverrides.hitBasePowers = [...(defaultOverrides.hitBasePowers || [])];
    }

    calcdexOverrides.hitBasePowers = calcdexOverrides.hitBasePowers.slice(0, clamp(0, options.hits));

    if (calcdexOverrides.hitBasePowers.length) {
      delete overrides.basePower;
    }
  }

  if (defensiveStatOverride) {
    overrides.overrideDefensiveStat = defensiveStatOverride;
  }

  if (offensiveStatOverride) {
    overrides.overrideOffensiveStat = offensiveStatOverride;
  }

  // always on for the Terapagos-Stellar, otherwise, one successful move per type only
  if (teraType === 'Stellar' && terastallized) {
    const dexMove = dex.moves.get(moveName as Parameters<typeof dex.moves.get>[0]);
    const { type: typeFromDex } = dexMove || {};
    const moveType = overrides.type || typeFromDex;

    options.isStellarFirstUse = stellarOverride ?? (
      speciesForme === 'Terapagos-Stellar'
        || (!!moveType && !stellarMoveMap?.[moveType])
    );
  }

  const smogonMove = new SmogonMove(dex, moveName, {
    ...options,
    overrides,
  });

  // for Z/Max base powers, SmogonMove performs a lookup with dex.moves.get(),
  // which is too much work to override, so we'll directly update the move's `bp` property
  const overrideUltBp = (move: SmogonMove) => {
    if (options.useZ && typeof zBasePowerOverride === 'number') {
      move.bp = Math.max(zBasePowerOverride, 0);
    } else if (options.useMax && typeof maxBasePowerOverride === 'number') {
      move.bp = Math.max(maxBasePowerOverride, 0);
    }
  };

  // note: this directly modifies the passed-in smogonMove (hence no return value)
  overrideUltBp(smogonMove);

  // calculate() from @smogon/calc will clone() the move before it's passed to the mechanics function,
  // which will remove our `bp` overrides since the SmogonMove constructor will recalculate the `bp` value again!
  smogonMove.clone = () => {
    const clonedMove = new SmogonMove(dex, moveName, {
      ...options,

      // not sure if these will change later
      hits: smogonMove.hits,
      timesUsed: smogonMove.timesUsed,
      timesUsedWithMetronome: smogonMove.timesUsedWithMetronome,

      overrides,
    });

    overrideUltBp(clonedMove);

    return clonedMove;
  };

  return [smogonMove, calcdexOverrides];
};
