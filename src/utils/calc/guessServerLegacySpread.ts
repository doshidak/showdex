import { type GenerationNum } from '@smogon/calc';
import { PokemonStatNames } from '@showdex/consts/dex';
import { type CalcdexPokemon, type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { env, nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { detectGenFromFormat, detectLegacyGen } from '@showdex/utils/dex';
import { calcLegacyHpIv, convertLegacyDvToIv } from './convertLegacyStats';
import { calcPokemonStat } from './calcPokemonStat';

const l = logger('@showdex/utils/calc/guessServerLegacySpread()');

/**
 * Attempts to guess a legacy spread (DVs) of the passed-in `pokemon`.
 *
 * * All DVs will be converted into IVs in the returned preset.
 *   - Note that in legacy gens, SPA and SPD IVs will be the same value.
 * * Unlike `guessServerSpread()`, only `ivs` will be present in the returned object.
 *   - Natures and EVs are not used in legacy gens.
 *   - This actually makes guessing a lot more efficient LOL.
 *
 * @since 1.0.2
 */
export const guessServerLegacySpread = (
  format: GenerationNum | string,
  pokemon: CalcdexPokemon,
): Partial<CalcdexPokemonPreset> => {
  const gen = format === 'string'
    ? detectGenFromFormat(format, env.int<GenerationNum>('calcdex-default-gen'))
    : format;

  if (!detectLegacyGen(gen)) {
    if (__DEV__) {
      l.warn(
        'Cannot guess a non-legacy spread; use guessServerSpread() instead.',
        '\n', 'format', format, 'gen', gen,
        '\n', 'pokemon', pokemon,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  // pretty much copied and pasted from guessServerSpread()... yup lmao
  if (!pokemon?.speciesForme) {
    if (__DEV__) {
      l.warn(
        'Received an invalid Pokemon', pokemon?.ident || pokemon?.speciesForme,
        '\n', 'format', format, 'gen', gen,
        '\n', 'pokemon', pokemon,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  if (!nonEmptyObject(pokemon.baseStats)) {
    if (__DEV__) {
      l.warn(
        'No baseStats were found for Pokemon', pokemon.ident || pokemon.speciesForme,
        '\n', 'format', format, 'gen', gen,
        '\n', 'pokemon', pokemon,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  if (__DEV__ && pokemon.source !== 'server') {
    l.warn(
      'Attempting to guess the spread of non-server Pokemon', pokemon.ident || pokemon.speciesForme,
      '\n', 'format', format, 'gen', gen,
      '\n', 'pokemon', pokemon,
      '\n', '(You will only see this warning on development.)',
    );
  }

  const {
    baseStats,
    serverStats,
  } = pokemon;

  // since HP DV is dependent on other DVs, this will skip the HP DV check if true
  const ignoreHp = !serverStats.hp;

  // this is the spread that we'll return after guessing
  const guessedSpread: Partial<CalcdexPokemonPreset> = {
    ivs: {},
    evs: { hp: 252 },
  };

  // logs of each guess (only on development)
  const logs: string[] = [];

  // will be used to verify if the guess with the serverStats (not returned)
  const calculatedStats: Showdown.StatsTable = {
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  };

  for (const stat of PokemonStatNames) {
    // requires the DVs of other stats, so we'll ignore HP for now
    if (stat === 'hp') {
      continue;
    }

    for (let dv = 15; dv > 0; dv--) {
      const iv = convertLegacyDvToIv(dv);

      for (const ev of [252, 0]) { // update (2023/07/25): fuck
        // note: for gen 1, SPA and SPD should be the same since only SPC exists
        calculatedStats[stat] = calcPokemonStat(
          gen,
          stat,
          baseStats[stat],
          iv,
          ev,
          pokemon.level,
        );

        if (__DEV__) {
          logs.push([
            'TRY ',
            stat.toUpperCase(),
            `DV ${dv}`, `(IV ${iv})`, `EV ${ev}`, '=',
            calculatedStats[stat], '===', serverStats[stat], '?',
            calculatedStats[stat] === serverStats[stat] ? 'PASS' : 'FAIL',
          ].join(' '));
        }

        if (calculatedStats[stat] === serverStats[stat]) {
          if (__DEV__) {
            logs.push([
              'DONE',
              stat.toUpperCase(),
              `DV ${dv}`, `(IV ${iv})`, `EV ${ev}`, '=',
              calculatedStats[stat],
            ].join(' '));
          }

          guessedSpread.ivs[stat] = iv;
          guessedSpread.evs[stat] = ev;

          break;
        }
      }

      if (calculatedStats[stat] === serverStats[stat]) {
        break;
      }
    }
  }

  // attempt to calculate the HP stat whether the IVs are available or not
  guessedSpread.ivs.hp = calcLegacyHpIv(guessedSpread.ivs);

  calculatedStats.hp = calcPokemonStat(
    gen,
    'hp',
    baseStats.hp,
    guessedSpread.ivs.hp,
    guessedSpread.evs.hp,
    pokemon.level,
  );

  if (__DEV__) {
    logs.push([
      'TRY ',
      'HP',
      `IV ${guessedSpread.ivs.hp}`, `EV ${guessedSpread.evs.hp}`, '=',
      calculatedStats.hp, '===', serverStats.hp, '?',
      calculatedStats.hp === serverStats.hp ? 'PASS' : 'FAIL',
    ].join(' '));
  }

  // note: for gen 1, calculated SPA and SPD *should* be the same, but we'll check anyways
  // (not the case for gen 2 tho -- calculated SPA and SPD may be very different,
  // though the SPA and SPD DVs should be exactly the same)
  const statsMatch = (ignoreHp || serverStats.hp === calculatedStats.hp)
    && serverStats.atk === calculatedStats.atk
    && serverStats.def === calculatedStats.def
    && serverStats.spa === calculatedStats.spa
    && serverStats.spd === calculatedStats.spd
    && serverStats.spe === calculatedStats.spe;

  // for legacy gens, we basically only got one shot cause there are wayyy less possibilities
  if (!statsMatch) {
    l.debug(
      'Failed to find the actual spread for Pokemon', pokemon.ident || pokemon.speciesForme,
      '\n', 'guessedSpread', guessedSpread,
      '\n', 'calculatedStats', calculatedStats,
      '\n', 'serverStats', serverStats,
      '\n', 'pokemon', pokemon,
      '\n', 'logs', logs,
    );

    // reset the IVs cause they no good
    guessedSpread.ivs = {};
  }

  return guessedSpread;
};
