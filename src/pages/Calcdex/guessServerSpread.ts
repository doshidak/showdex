import { PokemonCommonNatures, PokemonStatNames } from '@showdex/consts';
import { logger } from '@showdex/utils/debug';
import type { Generation } from '@pkmn/data';
import type { CalcdexPokemon, CalcdexPokemonPreset } from './CalcdexReducer';

const l = logger('Calcdex/guessServerSpread');

/**
 * Attempts to guess the spread (nature/EVs/IVs) of the passed-in `ServerPokemon`.
 *
 * * The client unfortunately only gives us the *final* stats after the spread has been applied.
 * * This attempts to brute-force different values to obtain those final stats.
 * * Probably one of the worst things I've ever written, but it works... kinda.
 *   - There's this nasty part of the function with 4 nested `for` loops, resulting in `O(n^4)`.
 *     - That's not even including the loops outside of this function!
 *   - Will occassionally guess the wrong nature with some Chinese EVs/IVs.
 *   - Apparently, there are more than one spread combination that can give the same final stats.
 *
 * @todo find a better way to implement or optimize this algorithm cause it's BAAAADDDD LOLOL
 * @since 0.1.1
 */
export const guessServerSpread = (
  dex: Generation,
  clientPokemon: Partial<Showdown.Pokemon & CalcdexPokemon>,
  serverPokemon: Showdown.ServerPokemon,
): Partial<CalcdexPokemonPreset> => {
  if (typeof dex?.species?.get !== 'function') {
    l.warn(
      'received an invalid dex argument w/o dex.species.get()',
      '\n', 'dex', dex,
      '\n', 'clientPokemon', clientPokemon,
      '\n', 'serverPokemon', serverPokemon,
    );

    return null;
  }

  if (!clientPokemon?.speciesForme) {
    l.warn(
      'received an invalid clientPokemon w/o a speciesForme',
      '\n', 'dex', dex,
      '\n', 'clientPokemon', clientPokemon,
      '\n', 'serverPokemon', serverPokemon,
    );

    return null;
  }

  const species = dex.species.get(clientPokemon.speciesForme);

  if (typeof species?.baseStats?.hp !== 'number') {
    l.warn(
      'guessServerSpread() <- dex.species.get()',
      '\n', 'received no baseStats for the given speciesForme',
      '\n', 'speciesForme', clientPokemon.speciesForme,
      '\n', 'species', species,
      '\n', 'dex', dex,
      '\n', 'clientPokemon', clientPokemon,
      '\n', 'serverPokemon', serverPokemon,
    );

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
    nature: null,
    ivs: {},
    evs: {},
  };

  // don't read any further... I'm warning you :o
  for (const natureName of PokemonCommonNatures) {
    const nature = dex.natures.get(natureName);

    // l.debug('trying nature', nature.name, 'for Pokemon', clientPokemon.ident);

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
        for (let ev = 252; ev >= 0; ev -= 4) { // try 252 to 0 in multiples of 4
          calculatedStats[stat] = dex.stats.calc(
            stat,
            baseStats[stat],
            iv,
            ev,
            clientPokemon.level,
            nature,
          );

          // warning: if you don't filter this log, there will be lots of logs (and I mean A LOT)
          // may crash your browser depending on your computer's specs. debug at your own risk!
          // if (clientPokemon.ident.endsWith('Clefable')) {
          //   l.debug(
          //     'trying to find the spread for', clientPokemon.ident, 'stat', stat,
          //     '\n', 'calculatedStat', calculatedStats[stat], 'knownStat', knownStats[stat],
          //     '\n', 'iv', iv, 'ev', ev,
          //     '\n', 'nature', nature.name, '+', nature.plus, '-', nature.minus,
          //   );
          // }

          if (calculatedStats[stat] === knownStats[stat]) {
            // this one isn't too bad to print, but will still cause a considerable slowdown
            // (you should only uncomment the debug log if shit is really hitting the fan)
            // l.debug(
            //   'found matching combination for', clientPokemon.ident, 'stat', stat,
            //   '\n', 'calculatedStat', calculatedStats[stat], 'knownStat', knownStats[stat],
            //   '\n', 'iv', iv, 'ev', ev,
            //   '\n', 'nature', nature.name, '+', nature.plus, '-', nature.minus,
            // );

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
      //   'found nature that matches all of the stats for Pokemon', clientPokemon.ident,
      //   '\n', 'nature', nature.name,
      //   '\n', 'calculatedStats', calculatedStats,
      //   '\n', 'knownStats', knownStats,
      //   '\n', 'dex', dex,
      //   '\n', 'clientPokemon', clientPokemon,
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
    'guessServerSpread() -> return guessedSpread',
    '\n', 'returning the best guess of the spread for Pokemon', clientPokemon.ident,
    '\n', 'guessedSpread', guessedSpread,
    '\n', 'dex', dex,
    '\n', 'clientPokemon', clientPokemon,
    '\n', 'serverPokemon', serverPokemon,
  );

  return guessedSpread;
};
