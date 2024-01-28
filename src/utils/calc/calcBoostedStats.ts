import { type GenerationNum } from '@smogon/calc';
import { PokemonBoostNames } from '@showdex/consts/dex';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { clamp } from '@showdex/utils/core';
import { detectLegacyGen } from '@showdex/utils/dex';
import { calcStatAutoBoosts } from './calcStatAutoBoosts';
import { type CalcdexStatModRecorder, statModRecorder } from './statModRecorder';

/**
 * Calculates the `pokemon`'s stats after applying its `dirtyBoosts` & `boosts`, if any.
 *
 * * Providing an optional `recorder` will write the results to that instead of returning a value.
 * * *Almost* guaranteed to return an empty object, as `null` is returned when providing a `recorder`.
 *
 * @since 1.2.0
 */
export const calcBoostedStats = (
  format: string | GenerationNum,
  pokemon: CalcdexPokemon,
  recorder?: CalcdexStatModRecorder,
): Showdown.StatsTable => {
  const hasRecorder = typeof recorder?.apply === 'function';
  const record = (hasRecorder && recorder) || statModRecorder(pokemon);

  if (!pokemon?.speciesForme || !format) {
    return hasRecorder ? null : record.stats();
  }

  const legacy = detectLegacyGen(format);
  const boostTable = legacy
    ? [1, 100 / 66, 2, 2.5, 100 / 33, 100 / 28, 4]
    : [1, 1.5, 2, 2.5, 3, 3.5, 4];

  const modifier = (stage: number) => {
    const index = clamp(0, Math.abs(stage), boostTable.length - 1);
    const value = boostTable[index] || 1;

    return stage > 0 ? value : (1 / value);
  };

  const {
    boosts: currentBoosts,
    // autoBoostMap,
    dirtyBoosts,
  } = pokemon;

  // const ignoreBoosts: Showdown.StatsTableNoHp = {};

  /*
  if (nonEmptyObject(autoBoostMap)) {
    Object.values(autoBoostMap).forEach((fx) => {
      const shouldIgnore = !nonEmptyObject(fx?.boosts)
        || (typeof fx.turn === 'number' && fx.turn > -1)
        || !fx.active;

      if (shouldIgnore) {
        return;
      }

      Object.entries(fx.boosts).forEach(([
        stat,
        stage,
      ]: [
        stat: Showdown.StatNameNoHp,
        stage: number,
      ]) => {
        if (!stage || typeof dirtyBoosts?.[stat] === 'number') {
          return;
        }

        /*
        if (typeof fx.turn === 'number') {
          if (typeof ignoreBoosts[stat] !== 'number') {
            ignoreBoosts[stat] = 0;
          }

          ignoreBoosts[stat] += stage;
        }
        *\/

        record.apply(
          stat,
          modifier(stage),
          fx.dict,
          fx.name,
          fx.reffectDict,
          fx.reffect,
        );
      });
    });
  }
  */

  PokemonBoostNames.forEach((stat) => {
    const autoBoost = calcStatAutoBoosts(pokemon, stat) || 0;
    // const ignoreBoost = ignoreBoosts[stat] || 0;

    const stage = (
      typeof dirtyBoosts?.[stat] === 'number'
        ? dirtyBoosts[stat]
        : ((currentBoosts?.[stat] || 0) + autoBoost)
    ) || 0;

    if (!stage) {
      return;
    }

    record.apply(
      stat,
      modifier(stage),
      'boost',
      `${stage > 0 ? '+' : ''}${stage} Stage`,
    );
  });

  return hasRecorder ? null : record.stats();
};
