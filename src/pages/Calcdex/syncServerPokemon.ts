import { logger } from '@showdex/utils/debug';
import type { Generation } from '@pkmn/data';
import type { CalcdexPokemon, CalcdexPokemonPreset } from './CalcdexReducer';
import type { PresetCacheHookInterface } from './usePresetCache';
import { calcPresetCalcdexId } from './calcCalcdexId';
// import { calcPokemonStats } from './calcPokemonStats';
import { detectPokemonIdent } from './detectPokemonIdent';
import { detectSpeciesForme } from './detectSpeciesForme';
import { guessServerSpread } from './guessServerSpread';

const l = logger('Calcdex/syncServerPokemon');

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
    const guessedSpread = guessServerSpread(dex, syncedPokemon, serverPokemon);

    serverPreset.nature = guessedSpread?.nature;
    serverPreset.ivs = { ...guessedSpread?.ivs };
    serverPreset.evs = { ...guessedSpread?.evs };
  }

  if (serverPreset.nature) {
    syncedPokemon.nature = serverPreset.nature;
  }

  if (Object.keys(serverPreset.ivs).length) {
    syncedPokemon.ivs = { ...serverPreset.ivs };
  }

  if (Object.keys(serverPreset.evs).length) {
    syncedPokemon.evs = { ...serverPreset.evs };
  }

  const serverAbility = serverPokemon?.ability ?
    dex.abilities.get(serverPokemon.ability) :
    null;

  if (serverAbility?.name) {
    // since we know the actual ability, no need to set it as a dirtyAbility
    serverPreset.ability = serverAbility.name;
    syncedPokemon.ability = serverAbility.name;
  }

  const serverItem = serverPokemon?.item ?
    dex.items.get(serverPokemon.item) :
    null;

  if (serverItem?.name) {
    // same goes for the item (as with the case of the ability); no need for dirtyItem
    serverPreset.item = serverItem.name;
    syncedPokemon.item = serverItem.name;
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

  // l.debug(
  //   'syncServerPokemon() -> return syncedPokemon',
  //   '\n', 'syncedPokemon', syncedPokemon,
  //   '\n', 'format', format,
  //   '\n', 'clientPokemon', clientPokemon,
  //   '\n', 'serverPokemon', serverPokemon,
  // );

  return syncedPokemon;
};
