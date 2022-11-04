import { Move as SmogonMove } from '@smogon/calc';
import { formatId } from '@showdex/utils/app';
import {
  getGenDexForFormat,
  // getMaxMove,
  // getZMove,
  // detectGenFromFormat,
} from '@showdex/utils/battle';
// import { env } from '@showdex/utils/core';
// import type { GenerationNum } from '@smogon/calc';
import type { MoveName } from '@smogon/calc/dist/data/interface';
import type { CalcdexPokemon } from '@showdex/redux/store';
// import { alwaysCriticalHits } from './alwaysCriticalHits';
import { calcHiddenPower } from './calcHiddenPower';
import { determineCriticalHit } from './determineCriticalHit';
import { determineMoveTargets } from './determineMoveTargets';

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
): SmogonMove => {
  // using the Dex global for the gen arg of SmogonMove seems to work here lol
  const dex = getGenDexForFormat(format);
  // const gen = detectGenFromFormat(format, env.int<GenerationNum>('calcdex-default-gen'));

  if (!dex || !format || !pokemon?.speciesForme || !moveName) {
    return null;
  }

  const ability = pokemon.dirtyAbility ?? pokemon.ability;
  const item = pokemon.dirtyItem ?? pokemon.item;

  const options: ConstructorParameters<typeof SmogonMove>[2] = {
    species: pokemon.speciesForme,

    ability,
    item,

    // only apply one of them, not both!
    useZ: pokemon.useZ && !pokemon.useMax,
    useMax: pokemon.useMax,

    // for moves that always crit, we need to make sure the crit doesn't apply when Z/Max'd
    // isCrit: (
    //   alwaysCriticalHits(moveName, format)
    //   && (!pokemon.useZ || !getZMove(moveName, item))
    //   && (!pokemon.useMax || !getMaxMove(moveName, ability, pokemon.speciesForme))
    // ) || pokemon.criticalHit,
    isCrit: determineCriticalHit(pokemon, moveName, format),
  };

  const overrides: SmogonMoveOverrides = {
    ...determineMoveTargets(pokemon, moveName, format),
  };

  // recalculate the base power if the move is Hidden Power
  if (formatId(moveName).includes('hiddenpower')) {
    overrides.basePower = calcHiddenPower(format, pokemon);
  }

  // check if the user specified any overrides for this move
  const {
    type: typeOverride,
    category: categoryOverride,
    basePower: basePowerOverride,
    zBasePower: zBasePowerOverride,
    maxBasePower: maxBasePowerOverride,
    alwaysCriticalHits: criticalHitOverride,
    defensiveStat: defensiveStatOverride,
    offensiveStat: offensiveStatOverride,
  } = pokemon.moveOverrides?.[moveName] || {};

  if (typeOverride) {
    overrides.type = typeOverride;
  }

  if (categoryOverride) {
    overrides.category = categoryOverride;
  }

  if (typeof basePowerOverride === 'number') {
    overrides.basePower = Math.max(basePowerOverride, 0);
  }

  // only supply this if it's true (otherwise, use the pre-determined value)
  if (criticalHitOverride) {
    options.isCrit = criticalHitOverride;
  }

  if (defensiveStatOverride === 'ignore') {
    overrides.ignoreDefensive = true;
  } else if (defensiveStatOverride) {
    overrides.overrideDefensiveStat = defensiveStatOverride;
  }

  if (offensiveStatOverride) {
    overrides.overrideOffensiveStat = offensiveStatOverride;
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

  // mechanics file will call clone() somewhere, which will remove our `bp` overrides since
  // the SmogonMove constructor will recalculate the `bp` value again!
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

  return smogonMove;
};
