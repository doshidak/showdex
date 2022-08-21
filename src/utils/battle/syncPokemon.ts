import { PokemonBoostNames } from '@showdex/consts';
import {
  calcPokemonSpreadStats,
  calcPresetCalcdexId,
  guessServerSpread,
} from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import type { Generation, GenerationNum } from '@pkmn/data';
import type {
  // CalcdexMoveState,
  CalcdexPokemon,
  CalcdexPokemonPreset,
} from '@showdex/redux/store';
import { sanitizePokemon, sanitizePokemonVolatiles } from './sanitizePokemon';
import { detectToggledAbility } from './detectToggledAbility';

// const l = logger('@showdex/utils/battle/syncPokemon');

export const syncPokemon = (
  pokemon: CalcdexPokemon,
  clientPokemon: DeepPartial<Showdown.Pokemon>,
  serverPokemon?: DeepPartial<Showdown.ServerPokemon>,
  dex?: Generation,
  format?: string,
): CalcdexPokemon => {
  // final synced Pokemon that will be returned at the end
  const syncedPokemon = structuredClone(pokemon) || {};

  // you should not be looping through any special CalcdexPokemon-specific properties here!
  (<(keyof NonFunctionProperties<Showdown.Pokemon>)[]> [
    'name',
    'hp',
    'maxhp',
    'status',
    'statusData',
    'ability',
    'baseAbility',
    'item',
    'itemEffect',
    'prevItem',
    'prevItemEffect',
    'moveTrack',
    'volatiles',
    'turnstatuses',
    'boosts',
  ]).forEach((key) => {
    const prevValue = syncedPokemon[<keyof CalcdexPokemon> key];
    let value = clientPokemon?.[key];

    if (value === undefined) {
      return;
    }

    switch (key) {
      case 'hp':
      case 'maxhp': {
        // note: returning at any point here will skip syncing the `value` from the
        // Showdown.Pokemon (i.e., clientPokemon) to the CalcdexPokemon (i.e., syncedPokemon)
        // (but only for the current `key` of the iteration, of course)
        if (typeof serverPokemon?.hp === 'number' && typeof serverPokemon.maxhp === 'number') {
          return;
        }

        // note: breaking will continue the sync operation
        // (which in this case, if a serverPokemon wasn't provided, we'll use the hp/maxhp from the clientPokemon)
        break;
      }

      case 'ability': {
        if (!value) {
          return;
        }

        if (value === syncedPokemon.dirtyAbility) {
          syncedPokemon.dirtyAbility = null;
        }

        // update the abilityToggled state (always false if not applicable)
        syncedPokemon.abilityToggled = detectToggledAbility(clientPokemon);

        break;
      }

      case 'item': {
        // ignore any unrevealed item (resulting in a falsy value) that hasn't been knocked-off/consumed/etc.
        // (this can be checked since when the item be consumed, prevItem would NOT be falsy)
        if ((!value || value === '(exists)') && !clientPokemon?.prevItem) {
          return;
        }

        // clear the dirtyItem if it's what the Pokemon actually has
        // (otherwise, if the item hasn't been revealed yet, `value` would be falsy,
        // but that's ok cause we have dirtyItem, i.e., no worries about clearing the user's input)
        if (value === syncedPokemon.dirtyItem) {
          syncedPokemon.dirtyItem = null;
        }

        break;
      }

      case 'prevItem': {
        // check if the item was knocked-off and is the same as dirtyItem
        // if so, clear the dirtyItem
        // (note that `value` here is prevItem, NOT item!)
        if (clientPokemon?.prevItemEffect === 'knocked off' && value === syncedPokemon.dirtyItem) {
          syncedPokemon.dirtyItem = null;
        }

        break;
      }

      case 'boosts': {
        value = PokemonBoostNames.reduce<Showdown.StatsTable>((prev, stat) => {
          const prevBoost = prev[stat];
          const boost = clientPokemon?.boosts?.[stat] || 0;

          if (boost !== prevBoost) {
            prev[stat] = boost;
          }

          return prev;
        }, {
          atk: syncedPokemon.boosts?.atk || 0,
          def: syncedPokemon.boosts?.def || 0,
          spa: syncedPokemon.boosts?.spa || 0,
          spd: syncedPokemon.boosts?.spd || 0,
          spe: syncedPokemon.boosts?.spe || 0,
        });

        break;
      }

      case 'moves': {
        const moves = <CalcdexPokemon['moves']> value;

        if (!moves?.length) {
          return;
        }

        break;
      }

      case 'moveTrack': {
        const moveTrack = <Showdown.Pokemon['moveTrack']> value;

        if (moveTrack?.length) {
          syncedPokemon.moveState = {
            ...syncedPokemon.moveState,

            // filter out any Z/Max moves from the revealed list
            revealed: moveTrack.map((track) => track?.[0]).filter((m) => {
              const move = dex?.moves?.get?.(m);

              return !!move?.name && !move?.isZ && !move?.isMax;
            }),
          };

          // l.debug('value of type CalcdexMoveState set to', syncedPokemon.moveState);
        }

        break;
      }

      case 'volatiles': {
        const volatiles = <Showdown.Pokemon['volatiles']> value;

        // sync Pokemon's dynamax state
        syncedPokemon.useUltimateMoves = 'dynamax' in volatiles;

        /**
         * @todo handle Ditto transformations here
         */

        // sanitizing to make sure a transformed ditto/mew doesn't crash the extension lol
        value = sanitizePokemonVolatiles(clientPokemon);

        break;
      }

      default: {
        break;
      }
    }

    if (JSON.stringify(value) === JSON.stringify(prevValue)) { // kekw
      return;
    }

    syncedPokemon[key] = structuredClone(value);
  });

  // fill in some additional fields if the serverPokemon was provided
  if (serverPokemon) {
    // should always be the case, idk why it shouldn't be (but you know we gotta check)
    if (typeof serverPokemon.hp === 'number' && typeof serverPokemon.maxhp === 'number') {
      // serverSourced is used primarily as a flag to distinguish `hp` as the actual value or as a percentage
      // (but since this conditional should always succeed in theory, should be ok to use to distinguish other properties)
      syncedPokemon.serverSourced = true;

      syncedPokemon.hp = serverPokemon.hp;
      syncedPokemon.maxhp = serverPokemon.maxhp;
    }

    if (serverPokemon.ability) {
      const dexAbility = dex.abilities.get(serverPokemon.ability);

      if (dexAbility?.name) {
        syncedPokemon.ability = dexAbility.name;
        syncedPokemon.dirtyAbility = null;
      }
    }

    if (serverPokemon.item) {
      const dexItem = dex.items.get(serverPokemon.item);

      if (dexItem?.name) {
        syncedPokemon.item = dexItem.name;
        syncedPokemon.dirtyItem = null;
      }
    }

    // copy the server stats for more accurate final stats calculations
    syncedPokemon.serverStats = {
      hp: serverPokemon.maxhp,
      ...serverPokemon.stats,
    };

    // since the server doesn't send us the Pokemon's EVs/IVs/nature, we gotta find it ourselves
    // (note that this function doesn't pull from syncedPokemon.serverStats, but rather serverPokemon.stats)
    const guessedSpread = guessServerSpread(
      dex,
      syncedPokemon,
      // serverPokemon, // since we have serverStats now, no need for this lol
      format?.includes('random') ? 'Hardy' : undefined,
    );

    // build a preset around the serverPokemon
    const serverPreset: CalcdexPokemonPreset = {
      name: 'Yours',
      gen: dex.num || <GenerationNum> env.int('calcdex-default-gen'),
      format,
      speciesForme: syncedPokemon.speciesForme || serverPokemon.speciesForme,
      level: syncedPokemon.level || serverPokemon.level,
      gender: syncedPokemon.gender || serverPokemon.gender || null,
      ability: syncedPokemon.ability,
      item: syncedPokemon.item,
      ...guessedSpread,
    };

    syncedPokemon.nature = serverPreset.nature;
    syncedPokemon.ivs = { ...serverPreset.ivs };
    syncedPokemon.evs = { ...serverPreset.evs };

    // need to do some special processing for moves
    // e.g., serverPokemon.moves = ['calmmind', 'moonblast', 'flamethrower', 'thunderbolt']
    // what we want: ['Calm Mind', 'Moonblast', 'Flamethrower', 'Thunderbolt']
    if (serverPokemon.moves?.length) {
      serverPreset.moves = serverPokemon.moves.map((moveName) => {
        const dexMove = dex.moves.get(moveName);

        if (!dexMove?.name) {
          return null;
        }

        return dexMove.name;
      }).filter(Boolean);

      syncedPokemon.moves = [...serverPreset.moves];
    }

    // calculate the stats with the EVs/IVs from the server preset
    // (note: same thing happens in applyPreset() in PokeInfo since the EVs/IVs from the preset are now available)
    if (typeof dex?.stats?.calc === 'function') {
      syncedPokemon.spreadStats = calcPokemonSpreadStats(dex, syncedPokemon);
    }

    serverPreset.calcdexId = calcPresetCalcdexId(serverPreset);

    const serverPresetIndex = syncedPokemon.presets
      .findIndex((p) => p.calcdexId === serverPreset.calcdexId);

    if (serverPresetIndex > -1) {
      syncedPokemon.presets[serverPresetIndex] = serverPreset;
    } else {
      syncedPokemon.presets.unshift(serverPreset);
    }

    // disabling autoPreset since we already set the preset here
    // (also tells PokeInfo not to apply the first preset)
    syncedPokemon.preset = serverPreset.calcdexId;
    syncedPokemon.autoPreset = false;
  }

  // only using sanitizePokemon() to get some values back
  const sanitizedPokemon = sanitizePokemon(syncedPokemon);

  // update some info if the Pokemon's speciesForme changed
  // (since moveState requires async, we update that in syncBattle())
  // if (pokemon.speciesForme !== syncedPokemon.speciesForme) {
  //   syncedPokemon.baseStats = { ...sanitizedPokemon.baseStats };
  //   syncedPokemon.types = sanitizedPokemon.types;
  //   syncedPokemon.ability = sanitizedPokemon.ability;
  //   syncedPokemon.dirtyAbility = null;
  //   syncedPokemon.abilities = sanitizedPokemon.abilities;
  // }

  syncedPokemon.abilityToggleable = sanitizedPokemon.abilityToggleable;
  syncedPokemon.abilityToggled = sanitizedPokemon.abilityToggled;

  // const calcdexId = calcPokemonCalcdexId(syncedPokemon);

  // if (!syncedPokemon?.calcdexId || syncedPokemon.calcdexId !== calcdexId) {
  //   syncedPokemon.calcdexId = calcdexId;
  // }

  // syncedPokemon.calcdexNonce = sanitizedPokemon.calcdexNonce;

  return syncedPokemon;
};
