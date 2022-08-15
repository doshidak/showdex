import { PokemonCommonNatures, PokemonStatNames } from '@showdex/consts';
import { logger } from '@showdex/utils/debug';
import type { Generation, NatureName } from '@pkmn/data';
import type { CalcdexPokemon, CalcdexPokemonPreset } from '@showdex/redux/store';

const l = logger('@showdex/utils/calc/guessServerSpread');

/**
 * Attempts to guess the spread (nature/EVs/IVs) of the passed-in `ServerPokemon`.
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
 *
 * @todo find a better way to implement or optimize this algorithm cause it's BAAAADDDD LOLOL
 * @since 0.1.1
 */
export const guessServerSpread = (
  dex: Generation,
  pokemon: CalcdexPokemon,
  serverPokemon: DeepPartial<Showdown.ServerPokemon>,
  knownNature?: NatureName,
): Partial<CalcdexPokemonPreset> => {
  if (!pokemon?.speciesForme) {
    if (__DEV__) {
      l.warn(
        'Received an invalid Pokemon without a speciesForme',
        '\n', 'pokemon', pokemon,
        '\n', 'serverPokemon', serverPokemon,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  const species = dex.species.get(pokemon.speciesForme);

  if (typeof species?.baseStats?.hp !== 'number') {
    if (__DEV__) {
      l.warn(
        '\n', 'Received no baseStats for the given speciesForme', pokemon.speciesForme,
        '\n', 'species', species,
        '\n', 'dex', dex,
        '\n', 'pokemon', pokemon,
        '\n', 'serverPokemon', serverPokemon,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  const baseStats: Showdown.StatsTable = {
    ...species.baseStats,
  };

  // since a ServerPokemon doesn't include the nature or EV/IV distribution,
  // but rather, only the final calculated stats, we need to figure out what
  // those original values were for the nature and EV/IVs.
  const {
    maxhp,
    stats: serverStats,
  } = serverPokemon;

  const knownStats: Showdown.StatsTable = {
    hp: maxhp,
    atk: serverStats?.atk,
    def: serverStats?.def,
    spa: serverStats?.spa,
    spd: serverStats?.spd,
    spe: serverStats?.spe,
  };

  // this is the spread that we'll return after guessing
  const guessedSpread: Partial<CalcdexPokemonPreset> = {
    nature: knownNature || null,
    ivs: {},
    evs: {},
  };

  const natureCombinations = [
    guessedSpread.nature,
    ...PokemonCommonNatures,
  ].filter(Boolean);

  // don't read any further... I'm warning you :o
  for (const natureName of natureCombinations) {
    const nature = dex.natures.get(natureName);

    // l.debug('trying nature', nature.name, 'for Pokemon', pokemon.ident);

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

      // don't say I didn't warn ya!
      for (let iv = 31; iv >= 0; iv -= 31) { // try only 31 and 0 for IVs (who assigns any other IVs?)
        for (let ev = 0; ev <= 252; ev += 4) { // try 252 to 0 in multiples of 4
          calculatedStats[stat] = dex.stats.calc(
            stat,
            baseStats[stat],
            iv,
            ev,
            pokemon.level,
            nature,
          );

          // warning: if you don't filter this log, there will be lots of logs (and I mean A LOT)
          // may crash your browser depending on your computer's specs. debug at your own risk!
          // if (pokemon.ident.includes('Kyurem')) {
          //   l.debug(
          //     'Trying to find the spread for', pokemon.ident, 'stat', stat,
          //     '\n', 'calculatedStat', calculatedStats[stat], 'knownStat', knownStats[stat],
          //     '\n', 'iv', iv, 'ev', ev,
          //     '\n', 'nature', nature.name, '+', nature.plus, '-', nature.minus,
          //   );
          // }

          if (calculatedStats[stat] === knownStats[stat]) {
            // this one isn't too bad to print, but will still cause a considerable slowdown
            // (you should only uncomment the debug log if shit is really hitting the fan)
            // if (pokemon.ident.includes('Lilligant')) {
            //   l.debug(
            //     'Found matching combination for', pokemon.ident, 'stat', stat,
            //     '\n', 'calculatedStat', calculatedStats[stat], 'knownStat', knownStats[stat],
            //     '\n', 'iv', iv, 'ev', ev,
            //     '\n', 'nature', nature.name, '+', nature.plus, '-', nature.minus,
            //   );
            // }

            guessedSpread.ivs[stat] = iv;
            guessedSpread.evs[stat] = ev;

            break;
          }

          // ya, that EV value wasn't it, chief
          delete guessedSpread.evs[stat];
        }

        if (calculatedStats[stat] === knownStats[stat]) {
          break;
        }
      }
    }

    const sameStats = knownStats.hp === calculatedStats.hp &&
      knownStats.atk === calculatedStats.atk &&
      knownStats.def === calculatedStats.def &&
      knownStats.spa === calculatedStats.spa &&
      knownStats.spd === calculatedStats.spd &&
      knownStats.spe === calculatedStats.spe;

    const evsLegal = Object.values(guessedSpread.evs)
      .reduce((sum, ev) => sum + ev, 0) <= 508; // 252 + 252 + 4 = 508

    if (sameStats && evsLegal) {
      // l.debug(
      //   'Found nature that matches all of the stats for Pokemon', pokemon.ident,
      //   '\n', 'nature', nature.name,
      //   '\n', 'calculatedStats', calculatedStats,
      //   '\n', 'knownStats', knownStats,
      //   '\n', 'dex', dex,
      //   '\n', 'pokemon', pokemon,
      //   '\n', 'serverPokemon', serverPokemon,
      // );

      guessedSpread.nature = nature.name;

      break;
    }

    // reset the EVs/IVs and try again LOL
    guessedSpread.ivs = {};
    guessedSpread.evs = {};
  }

  l.debug(
    '\n', 'Returning the best guess of the spread for Pokemon', pokemon.ident,
    '\n', 'guessedSpread', guessedSpread,
    '\n', 'dex', dex,
    '\n', 'pokemon', pokemon,
    '\n', 'serverPokemon', serverPokemon,
  );

  return guessedSpread;
};
