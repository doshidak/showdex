import { type GenerationNum } from '@smogon/calc';
import { PokemonCommonNatures, PokemonStatNames } from '@showdex/consts/dex';
import { type CalcdexPokemon, type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { env, nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { detectGenFromFormat, detectLegacyGen } from '@showdex/utils/dex';
import { calcPokemonStat } from './calcPokemonStat';

const l = logger('@showdex/utils/calc/guessServerSpread()');

/**
 * Attempts to guess the spread (nature/EVs/IVs) of the passed-in `pokemon`.
 *
 * * Client unfortunately only gives us the *final* stats after the spread has been applied.
 * * This attempts to brute-force different values to obtain those final stats.
 *   - If you know the nature, you can specify it under `knownNature` to vastly improve the guesswork.
 *   - For instance, you can assume the `knownNature` to be `'Hardy'` if the `format` is randoms.
 *   - Note that other natures will still be checked if a matching spread couldn't be found
 *     from the provided `knownNature`.
 * * Probably one of the worst things I've ever written, but it works... kinda.
 *   - There's this nasty part of the function with 4 nested `for` loops, resulting in `O(n^4)`.
 *     - That's not even including the loops outside of this function!
 * * Will occassionally guess a strange nature with some Chinese EVs/IVs.
 *   - Apparently, there can be more than one spread that can produce the same final stats.
 * * Guessing for HP will be ignored if the `hp` value in the `pokemon`'s `serverStats` is `0`.
 *   - This is most likely set by `syncPokemon()` prior to calling this function.
 *   - Indicates that the Pokemon is dead, so the server does not report the actual `maxhp` value.
 *   - Only occurs when the user is a player in the battle (as opposed to being a spectator) and
 *     refreshes the page mid-battle.
 *
 * @todo find a better way to implement or optimize this algorithm cause it's BAAAADDDD LOLOL
 * @since 0.1.1
 */
export const guessServerSpread = (
  format: string | GenerationNum,
  pokemon: CalcdexPokemon,
  knownNature?: Showdown.NatureName,
): Partial<CalcdexPokemonPreset> => {
  const gen = typeof format === 'string'
    ? detectGenFromFormat(format, env.int<GenerationNum>('calcdex-default-gen'))
    : format;

  if (detectLegacyGen(gen)) {
    if (__DEV__) {
      l.warn(
        'Cannot guess a legacy spread; use guessServerLegacySpread() instead.',
        '\n', 'format', format, 'gen', gen,
        '\n', 'pokemon', pokemon,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

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

  // 0 HP in serverStats indicates that the server hasn't reported the Pokemon's actual maxhp
  // (probably because they're dead, which is just dandy LOL)
  const ignoreHp = !serverStats.hp;

  // this is the spread that we'll return after guessing
  const guessedSpread: Partial<CalcdexPokemonPreset> = {
    nature: knownNature || null,
    ivs: {},
    evs: {},
  };

  const natureCombinations = guessedSpread?.nature
    ? [
      guessedSpread.nature,
      ...PokemonCommonNatures.filter((n) => n !== guessedSpread.nature),
    ].filter(Boolean)
    : PokemonCommonNatures;

  // logs of each guess (only on development)
  const logs: string[] = [];

  // don't read any further... I'm warning you :o
  for (const natureName of natureCombinations) {
    const calculatedStats: Showdown.StatsTable = {
      hp: 0,
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 0,
    };

    // ... no seriously, you should stop reading like right NOW!
    for (const stat of PokemonStatNames) {
      if (typeof guessedSpread.ivs[stat] === 'number' && typeof guessedSpread.evs[stat] === 'number') {
        break;
      }

      // if we're ignoring HP, set the IVs to 31 and EVs to 0 (for now)
      // (we'll set the remaining EVs to HP after spread guessing)
      if (ignoreHp && stat === 'hp') {
        guessedSpread.ivs.hp = 31;
        guessedSpread.evs.hp = 0;

        continue;
      }

      // don't say I didn't warn ya!
      for (let iv = 31; iv >= 0; iv--) { // update (2022/10/18): fuck it we're trying them all
        for (let ev = 0; ev <= 252; ev += 4) { // try 252 to 0 in multiples of 4
          calculatedStats[stat] = calcPokemonStat(
            gen,
            stat,
            baseStats[stat],
            iv,
            ev,
            pokemon.level,
            natureName,
          );

          if (__DEV__ && [0, 4, 80, 84, 88, 252].includes(ev)) {
            logs.push([
              'TRY ',
              natureName.padEnd(8, '·').toUpperCase(),
              stat.toUpperCase(),
              `IV ${iv}`, `EV ${ev}`, '=',
              calculatedStats[stat], '===', serverStats[stat], '?',
              calculatedStats[stat] === serverStats[stat] ? 'PASS' : 'FAIL',
            ].join(' '));
          }

          if (calculatedStats[stat] === serverStats[stat]) {
            if (__DEV__) {
              logs.push([
                'DONE',
                natureName.padEnd(8, '·').toUpperCase(),
                stat.toUpperCase(),
                `IV ${iv}`, `EV ${ev}`, '=',
                calculatedStats[stat],
              ].join(' '));
            }

            guessedSpread.ivs[stat] = iv;
            guessedSpread.evs[stat] = ev;

            break;
          }

          // ya, that EV value wasn't it, chief
          // delete guessedSpread.evs[stat];
        }

        if (calculatedStats[stat] === serverStats[stat]) {
          break;
        }
      }
    }

    const statsMatch = (ignoreHp || serverStats.hp === calculatedStats.hp)
      && serverStats.atk === calculatedStats.atk
      && serverStats.def === calculatedStats.def
      && serverStats.spa === calculatedStats.spa
      && serverStats.spd === calculatedStats.spd
      && serverStats.spe === calculatedStats.spe;

    const maxLegalEvs = env.int('calcdex-pokemon-max-legal-evs'); // 252 + 252 + 4 = 508
    const totalEvs = Object.values(guessedSpread.evs).reduce((sum, ev) => sum + ev, 0);

    const evsLegal = totalEvs <= maxLegalEvs;

    if (statsMatch && evsLegal) {
      // l.debug(
      //   'Found nature that matches all of the stats for Pokemon', pokemon.ident || pokemon.speciesForme,
      //   '\n', 'nature', natureName,
      //   '\n', 'calculatedStats', calculatedStats,
      //   '\n', 'serverStats', serverStats,
      //   '\n', 'pokemon', pokemon,
      // );

      guessedSpread.nature = natureName;

      // if we ignored the HP before, we'll set the remaining EVs to HP
      if (ignoreHp && maxLegalEvs - totalEvs > 0) {
        guessedSpread.evs.hp = maxLegalEvs - totalEvs;
      }

      break;
    }

    // reset the EVs/IVs and try again LOL
    guessedSpread.ivs = {};
    guessedSpread.evs = {};
  }

  if (!nonEmptyObject({ ...guessedSpread.ivs, ...guessedSpread.evs })) {
    l.debug(
      'Failed to find the actual spread for Pokemon', pokemon.ident || pokemon.speciesForme,
      '\n', 'guessedSpread', guessedSpread,
      '\n', 'serverStats', serverStats,
      '\n', 'pokemon', pokemon,
      '\n', 'logs', logs,
    );
  }

  // } else {
  //   l.debug(
  //     'Returning the best guess of the spread for Pokemon', pokemon.ident || pokemon.speciesForme,
  //     '\n', 'guessedSpread', guessedSpread,
  //     '\n', 'serverStats', serverStats,
  //     '\n', 'pokemon', pokemon,
  //   );
  // }

  return guessedSpread;
};
