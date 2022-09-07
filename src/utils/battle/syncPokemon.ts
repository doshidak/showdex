import { PokemonBoostNames } from '@showdex/consts';
import { formatId } from '@showdex/utils/app';
import {
  calcPokemonSpreadStats,
  calcPresetCalcdexId,
  guessServerSpread,
} from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import type {
  AbilityName,
  Generation,
  GenerationNum,
  ItemName,
  MoveName,
} from '@pkmn/data';
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
    'speciesForme',
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
    // 'moves', // warning: do not sync unless you want to overwrite the (Calcdex) user's moves
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
      case 'speciesForme': {
        // if the speciesForme changed, update the types and possible abilities
        // (could change due to mega-evolutions or gigantamaxing, for instance)
        if (prevValue !== value && typeof Dex !== 'undefined') {
          const updatedSpecies = Dex.species.get(<string> value);

          syncedPokemon.types = [...(updatedSpecies?.types || syncedPokemon.types || [])];

          if (Object.keys(updatedSpecies?.abilities).length) {
            syncedPokemon.abilities = [...(<AbilityName[]> Object.values(updatedSpecies.abilities))];
          }
        }

        break;
      }

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
        if ((!value || formatId(<string> value) === 'exists') && !clientPokemon?.prevItem) {
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

      // case 'moves': {
      //   const moves = <CalcdexPokemon['moves']> value;
      //
      //   if (!moves?.length) {
      //     return;
      //   }
      //
      //   // clean up any transformed moves
      //   value = moves
      //     .filter(Boolean)
      //     .map((name) => (name.includes('*') ? name.replace(/\*/g, '') : name));
      //
      //   break;
      // }

      case 'moveTrack': {
        const moveTrack = <Showdown.Pokemon['moveTrack']> value;

        if (moveTrack?.length) {
          syncedPokemon.moveState = {
            ...syncedPokemon.moveState,

            // filter out any Z/Max moves from the revealed list
            revealed: moveTrack.map((track) => track?.[0]).filter((name) => {
              const move = Dex?.moves.get(name);

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
        // syncedPokemon.useUltimateMoves = 'dynamax' in volatiles;
        syncedPokemon.useMax = 'dynamax' in volatiles;

        // check for type changes
        const changedTypes = 'typechange' in volatiles
          ? <Showdown.TypeName[]> volatiles.typechange[1]?.split?.('/') || [] // 'Psychic/Ice' -> ['Psychic', 'Ice']
          : [];

        if (changedTypes.length) {
          syncedPokemon.types = changedTypes;
        }

        // check for transformations (e.g., from Ditto/Mew)
        const transformedPokemon = 'transform' in volatiles
          ? <Showdown.Pokemon> <unknown> volatiles.transform[1]
          : null;

        syncedPokemon.transformedForme = transformedPokemon?.speciesForme
          ? transformedPokemon.speciesForme
          : null;

        // check for (untransformed) forme changes
        const formeChange = 'formechange' in volatiles
          ? volatiles.formechange[1] || null
          : null;

        if (!transformedPokemon && formeChange) {
          syncedPokemon.speciesForme = formeChange;
        }

        // sanitizing to make sure a transformed Pokemon doesn't crash the extension lol
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
  if (serverPokemon?.ident) {
    // should always be the case, idk why it shouldn't be (but you know we gotta check)
    if (typeof serverPokemon.hp === 'number' && typeof serverPokemon.maxhp === 'number') {
      // serverSourced is used primarily as a flag to distinguish `hp` as the actual value or as a percentage
      // (but since this conditional should always succeed in theory, should be ok to use to distinguish other properties)
      syncedPokemon.serverSourced = true;

      syncedPokemon.hp = serverPokemon.hp;

      // make sure `maxhp` isn't a percentage (which is usually the case with dead Pokemon, i.e., 0% HP)
      // (this isn't foolproof tho cause there could be instances where the `maxhp` is legit 100 lol)
      if (serverPokemon.hp || serverPokemon.maxhp !== 100) {
        syncedPokemon.maxhp = serverPokemon.maxhp;
      }
    }

    if (serverPokemon.ability) {
      const dexAbility = Dex.abilities.get(serverPokemon.ability);

      if (dexAbility?.name) {
        syncedPokemon.ability = <AbilityName> dexAbility.name;
        syncedPokemon.dirtyAbility = null;
      }
    }

    if (serverPokemon.item) {
      const dexItem = Dex.items.get(serverPokemon.item);

      if (dexItem?.name) {
        syncedPokemon.item = <ItemName> dexItem.name;
        syncedPokemon.dirtyItem = null;
      }
    }

    // copy the server stats for more accurate final stats calculations
    if (!Object.keys(syncedPokemon.serverStats || {}).length && Object.keys(serverPokemon.stats || {}).length) {
      syncedPokemon.serverStats = {
        ...serverPokemon.stats,
        hp: serverPokemon.maxhp,
      };

      // when refreshing the page, server will report dead ServerPokemon with 0 hp and 100 maxhp,
      // which breaks the guessing part since no EV/IV combination may match 100 HP
      // (setting 0 HP for the serverStats tells guessServerSpread() to ignore the HP when guessing)
      if (!serverPokemon.hp && serverPokemon.maxhp === 100) {
        syncedPokemon.serverStats.hp = 0;
      }
    }

    // sanitize the moves from the serverPokemon
    const serverMoves = serverPokemon.moves?.map?.((moveName) => {
      const dexMove = Dex.moves.get(moveName);

      if (!dexMove?.name) {
        return null;
      }

      return <MoveName> dexMove.name;
    }).filter(Boolean);

    // since the server doesn't send us the Pokemon's EVs/IVs/nature, we gotta find it ourselves
    const guessedSpread = guessServerSpread(
      dex,
      syncedPokemon,
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

    // in case a post-transformed Ditto breaks the original preset
    const presetValid = !!serverPreset.nature
      && !!Object.keys({ ...serverPreset.ivs, ...serverPreset.evs }).length;

    if (presetValid) {
      syncedPokemon.nature = serverPreset.nature;
      syncedPokemon.ivs = { ...serverPreset.ivs };
      syncedPokemon.evs = { ...serverPreset.evs };

      // need to do some special processing for moves
      // e.g., serverPokemon.moves = ['calmmind', 'moonblast', 'flamethrower', 'thunderbolt']
      // what we want: ['Calm Mind', 'Moonblast', 'Flamethrower', 'Thunderbolt']
      if (serverMoves?.length) {
        serverPreset.moves = [...serverMoves];
        syncedPokemon.moves = [...serverMoves];
      }

      // calculate the stats with the EVs/IVs from the server preset
      // (note: same thing happens in applyPreset() in PokeInfo since the EVs/IVs from the preset are now available)
      // (update: we calculate this at the end now, before syncedPokemon is returned)
      // if (typeof dex?.stats?.calc === 'function') {
      //   syncedPokemon.spreadStats = calcPokemonSpreadStats(dex, syncedPokemon);
      // }

      serverPreset.calcdexId = calcPresetCalcdexId(serverPreset);

      // technically, this should be a one-time thing, but if not, we'll at least want only have 1 'Yours' preset
      const serverPresetIndex = syncedPokemon.presets
        // .findIndex((p) => p.calcdexId === serverPreset.calcdexId);
        .findIndex((p) => p.name === 'Yours');

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

    // set the serverMoves/transformedMoves if provided
    if (serverMoves?.length) {
      const moveKey = syncedPokemon.transformedForme
        ? 'transformedMoves'
        : 'serverMoves';

      syncedPokemon[moveKey] = [...serverMoves];
    }
  }

  // only using sanitizePokemon() to get some values back
  // (is this a good idea? idk)
  const {
    abilities: transformedAbilities,
    abilityToggleable,
    abilityToggled,
    baseStats,
    transformedForme, // yeah ik this is already set above, but double-checking lol
    transformedBaseStats,
  } = sanitizePokemon(syncedPokemon, dex?.num);

  // check for toggleable abilities
  syncedPokemon.abilityToggleable = abilityToggleable;
  syncedPokemon.abilityToggled = abilityToggled;

  // check for base stats (in case of forme changes)
  if (Object.values(baseStats).filter(Boolean).length) {
    syncedPokemon.baseStats = { ...baseStats };
  }

  // check for transformed base stats
  syncedPokemon.transformedBaseStats = transformedForme ? {
    ...transformedBaseStats,
  } : null;

  // if the Pokemon is transformed, auto-set the moves
  /** @todo make auto-setting transformed moves a toggle? */
  if (syncedPokemon.transformedMoves?.length) {
    if (transformedForme) {
      syncedPokemon.moves = [...syncedPokemon.transformedMoves];
    } else {
      // clear the list of transformed moves since the Pokemon is no longer transformed
      syncedPokemon.transformedMoves = [];
    }
  }

  // recalculate the spread stats
  // (calcPokemonSpredStats() will determine whether to use the transformedBaseStats or baseStats)
  syncedPokemon.spreadStats = calcPokemonSpreadStats(dex, syncedPokemon);

  if (transformedForme && transformedAbilities?.length) {
    syncedPokemon.abilities = [...transformedAbilities];
  }

  // we're done! ... I think
  return syncedPokemon;
};
