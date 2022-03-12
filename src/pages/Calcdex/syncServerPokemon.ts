import { PokemonStatNames } from '@showdex/consts';
import { logger } from '@showdex/utils/debug';
import type { Generation } from '@pkmn/data';
import type { CalcdexPokemon, CalcdexPokemonPreset } from './CalcdexReducer';
import type { PresetCacheHookInterface } from './usePresetCache';
import { calcPresetCalcdexId } from './calcCalcdexId';
// import { calcPokemonStats } from './calcPokemonStats';
import { detectPokemonIdent } from './detectPokemonIdent';
import { detectSpeciesForme } from './detectSpeciesForme';

const l = logger('Calcdex/syncServerPokemon');

/**
 * These are used by the nature/EV/IV finding algorithm,
 * based on the Pokemon's final calculated stats.
 *
 * * Ordering of each nature is intentional,
 *   from common natures to more obscure ones.
 * * Any nature that does not boost any stat is ignored,
 *   except for Hardy (since it's used in randoms), which is last.
 */
const natures: Showdown.NatureName[] = [
  'Adamant',
  'Modest',
  'Jolly',
  'Timid',
  'Bold',
  'Brave',
  'Calm',
  'Careful',
  'Gentle',
  'Hasty',
  'Impish',
  'Lax',
  'Lonely',
  'Mild',
  'Naive',
  'Naughty',
  'Quiet',
  'Rash',
  'Relaxed',
  'Sassy',
  'Hardy',
];

export const syncServerPokemon = (
  dex: Generation,
  cache: PresetCacheHookInterface,
  format: string,
  clientPokemon: Partial<Showdown.Pokemon & CalcdexPokemon>,
  serverPokemon: Showdown.ServerPokemon,
): CalcdexPokemon => {
  if (!serverPokemon?.stats) {
    l.debug(
      'serverPokemon has no stats object',
      '\n', 'dex', dex,
      '\n', 'clientPokemon', clientPokemon,
      '\n', 'serverPokemon', serverPokemon,
    );

    return clientPokemon;
  }

  const isRandom = format?.includes?.('random');

  const syncedPokemon: CalcdexPokemon = {
    ...clientPokemon,
    serverSourced: true,

    name: serverPokemon.name ?? clientPokemon?.name,
    level: serverPokemon.level ?? clientPokemon?.level,

    ability: <CalcdexPokemon['ability']> serverPokemon?.ability ?? clientPokemon?.ability,
    moves: [...(<CalcdexPokemon['moves']> serverPokemon?.moves ?? clientPokemon?.moves ?? [])],

    // this will bypass `@p${#}/pokemon:sync` (i.e., `@p${#}/pokemon:put`),
    // so we need to specify this, otherwise there will be X's in the UI
    boosts: {
      atk: clientPokemon?.boosts?.atk ?? 0,
      def: clientPokemon?.boosts?.def ?? 0,
      spa: clientPokemon?.boosts?.spa ?? 0,
      spd: clientPokemon?.boosts?.spd ?? 0,
      spe: clientPokemon?.boosts?.spe ?? 0,
    },
  };

  syncedPokemon.ident = detectPokemonIdent(syncedPokemon);
  syncedPokemon.speciesForme = detectSpeciesForme(syncedPokemon);

  if (!syncedPokemon.speciesForme) {
    l.debug(
      'syncServerPokemon() <- detectSpeciesForme()',
      '\n', 'received an invalid speciesForme',
      '\n', 'speciesForme', syncedPokemon.speciesForme,
      '\n', 'syncedPokemon', syncedPokemon,
      '\n', 'clientPokemon', clientPokemon,
      '\n', 'serverPokemon', serverPokemon,
    );

    return clientPokemon;
  }

  const species = dex.species.get(syncedPokemon.speciesForme);

  if (!species?.baseStats?.hp) {
    l.debug(
      'syncServerPokemon() <- dex.species.get()',
      '\n', 'received no baseStats for the given speciesForme',
      '\n', 'speciesForme', syncedPokemon.speciesForme,
      '\n', 'species', species,
      '\n', 'syncedPokemon', syncedPokemon,
      '\n', 'clientPokemon', clientPokemon,
      '\n', 'serverPokemon', serverPokemon,
    );

    return clientPokemon;
  }

  const baseStats: Showdown.StatsTable = {
    ...species?.baseStats,
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

  // build a preset based on the serverPokemon's stats
  const serverPreset: CalcdexPokemonPreset = {
    name: isRandom ? 'Randoms' : 'Yours',
    level: syncedPokemon.level,
    gender: syncedPokemon.gender,
    ivs: {},
    evs: {},
  };

  // all Pokemon in randoms have a Hardy nature w/ 31 IVs (unless specified) & 84 EVs
  if (isRandom) {
    const [randomPreset] = cache.get(format, syncedPokemon.speciesForme);

    serverPreset.ivs = {
      hp: 31,
      atk: 31,
      def: 31,
      spa: 31,
      spd: 31,
      spe: 31,
    };

    serverPreset.evs = {
      hp: 84,
      atk: 84,
      def: 84,
      spa: 84,
      spd: 84,
      spe: 84,
    };

    serverPreset.nature = 'Hardy';

    if (randomPreset) {
      serverPreset.ivs = { ...serverPreset.ivs, ...randomPreset?.ivs };
      serverPreset.evs = { ...serverPreset.evs, ...randomPreset?.evs };
      serverPreset.altAbilities = randomPreset?.altAbilities;
      serverPreset.altItems = randomPreset?.altItems;
      serverPreset.altMoves = randomPreset?.altMoves;
    }
  } else {
    // low-key terrible cause of the O(n^4) complexity (from this alone), but w/e
    for (const natureName of natures) {
      const nature = dex.natures.get(natureName);

      // l.debug('trying nature', nature.name, 'for Pokemon', syncedPokemon.ident);

      const calculatedStats: Showdown.StatsTable = {
        hp: 0,
        atk: 0,
        def: 0,
        spa: 0,
        spd: 0,
        spe: 0,
      };

      for (const stat of PokemonStatNames) {
        if (typeof serverPreset.ivs[stat] === 'number' && typeof serverPreset.evs[stat] === 'number') {
          break;
        }

        for (let iv = 31; iv >= 0; iv -= 31) { // try only 31 and 0 for IVs (who assigns any other IVs?)
          for (let ev = 252; ev >= 0; ev -= 4) { // try 252 to 0 in multiples of 4
            calculatedStats[stat] = dex.stats.calc(
              stat,
              baseStats[stat],
              iv,
              ev,
              syncedPokemon.level,
              nature,
            );

            // warning: if you don't filter this log, there will be lots of logs (and I mean A LOT)
            // may crash your browser depending on your computer's specs. debug at your own risk!
            // if (syncedPokemon.ident === 'p2: Clefable') {
            //   l.debug(
            //     'trying to find the spread for', syncedPokemon.ident, 'stat', stat,
            //     '\n', 'calculatedStat', calculatedStats[stat], 'knownStat', knownStats[stat],
            //     '\n', 'iv', iv, 'ev', ev,
            //     '\n', 'nature', nature.name, '+', nature.plus, '-', nature.minus,
            //   );
            // }

            if (calculatedStats[stat] === knownStats[stat]) {
              l.debug(
                'found matching combination for', syncedPokemon.ident, 'stat', stat,
                '\n', 'calculatedStat', calculatedStats[stat], 'knownStat', knownStats[stat],
                '\n', 'iv', iv, 'ev', ev,
                '\n', 'nature', nature.name, '+', nature.plus, '-', nature.minus,
              );

              serverPreset.ivs[stat] = iv;
              serverPreset.evs[stat] = ev;

              break;
            }

            delete serverPreset.evs[stat];
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

      const evsLegal = Object.values(serverPreset.evs)
        .reduce((sum, ev) => sum + ev, 0) <= 508; // 252 + 252 + 4 = 508

      if (sameStats && evsLegal) {
        l.debug(
          'found nature that matches all of the Pokemon\'s stats',
          '\n', 'nature', nature.name,
          '\n', 'calculatedStats', calculatedStats,
          '\n', 'knownStats', knownStats,
        );

        serverPreset.nature = nature.name;

        break;
      } else {
        serverPreset.ivs = {};
        serverPreset.evs = {};
      }
    }
  }

  if (serverPreset.nature) {
    syncedPokemon.nature = serverPreset.nature;
  }

  if (Object.keys(serverPreset.ivs).length) {
    syncedPokemon.ivs = {
      // ...syncedPokemon.ivs,
      ...serverPreset.ivs,
    };
  }

  if (Object.keys(serverPreset.evs).length) {
    syncedPokemon.evs = {
      // ...syncedPokemon.evs,
      ...serverPreset.evs,
    };
  }

  const serverAbility = serverPokemon?.ability ?
    dex.abilities.get(serverPokemon.ability) :
    null;

  if (serverAbility?.name) {
    serverPreset.ability = serverAbility.name;
    syncedPokemon.dirtyAbility = serverAbility.name;
  }

  const serverItem = serverPokemon?.item ?
    dex.items.get(serverPokemon.item) :
    null;

  if (serverItem?.name) {
    serverPreset.item = serverItem.name;
    syncedPokemon.dirtyItem = serverItem.name;
  }

  if (serverPokemon?.moves?.length) {
    // e.g., serverPokemon.moves = ['calmmind', 'moonblast', 'flamethrower', 'thunderbolt']
    // what we want: ['Calm Mind', 'Moonblast', 'Flamethrower', 'Thunderbolt']
    serverPreset.moves = serverPokemon.moves.map((moveName) => {
      const move = dex.moves.get(moveName);

      if (!move?.name) {
        return null;
      }

      return move.name;
    }).filter(Boolean);

    syncedPokemon.moves = [...serverPreset.moves];
  }

  serverPreset.calcdexId = calcPresetCalcdexId(serverPreset);

  if (!Array.isArray(syncedPokemon?.presets)) {
    syncedPokemon.presets = [];
  }

  syncedPokemon.presets.unshift(serverPreset);
  syncedPokemon.preset = serverPreset.calcdexId;
  syncedPokemon.autoPreset = true;

  // update (2022/03/10): calculatedStats is now being calculated (and memoized) on the fly in PokeCalc
  // syncedPokemon.calculatedStats = calcPokemonStats(dex, syncedPokemon);

  // l.debug(
  //   'return syncedPokemon',
  //   '\n', 'syncedPokemon', syncedPokemon,
  // );

  return syncedPokemon;
};
