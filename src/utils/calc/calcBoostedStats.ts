import { type GenerationNum } from '@smogon/calc';
import { PokemonBoostNames } from '@showdex/consts/dex';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { detectLegacyGen } from '@showdex/utils/dex';
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

  const {
    boosts: currentBoosts,
    dirtyBoosts,
  } = pokemon;

  const boosts = PokemonBoostNames.reduce((prev, stat) => {
    prev[stat] = (dirtyBoosts?.[stat] ?? currentBoosts?.[stat]) || 0;

    return prev;
  }, {} as Showdown.StatsTable);

  Object.entries(boosts)
    .filter(([, stage]) => !!stage)
    .forEach(([
      stat,
      stage,
    ]: [
      stat: Showdown.StatName,
      stage: number,
    ]) => {
      const boostValue = boostTable[Math.abs(stage)];
      const modifier = stage > 0 ? boostValue : (1 / boostValue);

      record.apply(
        stat,
        modifier,
        'boost',
        `${stage > 0 ? '+' : ''}${stage} Stage`,
      );
    });

  return hasRecorder ? null : record.stats();
};
