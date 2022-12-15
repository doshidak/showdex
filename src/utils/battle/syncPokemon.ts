import { PokemonBoostNames, PokemonTypes } from '@showdex/consts/pokemon';
import { formatId } from '@showdex/utils/app';
import {
  calcPokemonSpreadStats,
  calcPresetCalcdexId,
  guessServerLegacySpread,
  guessServerSpread,
} from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import { capitalize } from '@showdex/utils/humanize';
import type { GenerationNum } from '@smogon/calc';
import type { AbilityName, ItemName, MoveName } from '@smogon/calc/dist/data/interface';
import type {
  // CalcdexBattleField,
  CalcdexBattleState,
  // CalcdexMoveState,
  CalcdexPokemon,
  CalcdexPokemonPreset,
} from '@showdex/redux/store';
import { detectGenFromFormat } from './detectGenFromFormat';
import { detectLegacyGen } from './detectLegacyGen';
// import { detectToggledAbility } from './detectToggledAbility';
import { flattenAlts } from './flattenAlts';
import { getDexForFormat } from './getDexForFormat';
import { mergeRevealedMoves } from './mergeRevealedMoves';
import { sanitizePokemon } from './sanitizePokemon';
import { sanitizeMoveTrack } from './sanitizeMoveTrack';
import { sanitizeVolatiles } from './sanitizeVolatiles';
import { detectToggledAbility } from './detectToggledAbility';

// const l = logger('@showdex/utils/battle/syncPokemon');

export const syncPokemon = (
  pokemon: CalcdexPokemon,
  clientPokemon: DeepPartial<Showdown.Pokemon>,
  serverPokemon?: DeepPartial<Showdown.ServerPokemon>,
  // field?: CalcdexBattleField,
  state?: CalcdexBattleState,
  showAllFormes?: boolean,
  autoMoves?: boolean,
): CalcdexPokemon => {
  const dex = getDexForFormat(state?.format);
  const legacy = detectLegacyGen(state?.format);
  const gen = detectGenFromFormat(state?.format, env.int<GenerationNum>('calcdex-default-gen'));

  // final synced Pokemon that will be returned at the end
  const syncedPokemon = structuredClone(pokemon) || {};

  // you should not be looping through any special CalcdexPokemon-specific properties here!
  (<(keyof NonFunctionProperties<Showdown.Pokemon>)[]> [
    'name',
    'speciesForme',
    'hp',
    'maxhp',
    'teraType', // must be before 'volatiles' (in terms of array indices) !!!
    'status',
    'statusData',
    'timesAttacked',
    'ability',
    'baseAbility',
    'item',
    'itemEffect',
    'prevItem',
    'prevItemEffect',
    // 'moves', // warning: do not sync unless you want to overwrite the (Calcdex) user's moves
    'lastMove',
    'moveTrack',
    'volatiles',
    'turnstatuses',
    'boosts',
  ]).forEach((key) => {
    const prevValue = syncedPokemon[<keyof CalcdexPokemon> key];
    let value = clientPokemon?.[key];

    // note: this will accept null values!
    if (value === undefined) {
      return;
    }

    switch (key) {
      case 'speciesForme': {
        // e.g., 'Urshifu-*' -> 'Urshifu' (to fix forme switching, which is prevented due to the wildcard forme)
        value = (<string> value).replace('-*', '');

        // retain any switched Gmax formes if it still equals its forme in-battle with the Gmax suffix removed
        // (e.g., syncedPokemon.speciesForme = 'Cinderace-Gmax' and value = 'Cinderace' would equal)
        if (formatId(syncedPokemon.speciesForme.replace('-Gmax', '')) === formatId(value)) {
          return;
        }

        // if the speciesForme changed, update the types and possible abilities
        // (could change due to mega-evolutions or gigantamaxing, for instance)
        if (prevValue !== value && dex) {
          const updatedSpecies = dex.species.get(value);

          syncedPokemon.types = [
            ...(updatedSpecies?.types || syncedPokemon.types || []),
          ];

          if (Object.keys(updatedSpecies?.abilities).length) {
            syncedPokemon.abilities = [
              ...(<AbilityName[]> Object.values(updatedSpecies.abilities)),
            ];
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

      case 'teraType': {
        // replace a potentially empty string (or something potentially invalid like `false`) with null
        // (also no point storing a '???' type; null is perfectly acceptable since the UI should show '???' for falsy values)
        // update (2022/12/12): don't sync falsy values; clears your Pokemon's Tera types! LOL
        if (!value || value === '???') {
          // value = null;

          // break;
          return;
        }

        // make sure we got a valid type (just in case)
        // (note: value can't be '???' here at this point)
        value = capitalize(<string> value);

        if (!PokemonTypes.includes(<Showdown.TypeName> value)) {
          return;
        }

        break;
      }

      case 'status': {
        // remove the Pokemon's status if fainted
        if (!syncedPokemon.hp) {
          value = null;
        }

        break;
      }

      case 'statusData': {
        const statusData = <Showdown.Pokemon['statusData']> value;

        if (typeof statusData?.sleepTurns === 'number' && statusData.sleepTurns > -1) {
          syncedPokemon.sleepCounter = statusData.sleepTurns;
        }

        if (typeof statusData?.toxicTurns === 'number' && statusData.toxicTurns > -1) {
          syncedPokemon.toxicCounter = statusData.toxicTurns;
        }

        return;
      }

      case 'timesAttacked': {
        if (typeof value === 'number' && value > -1) {
          syncedPokemon.hitCounter = value;
        }

        return;
      }

      case 'ability': {
        if (!value || /^\([\w\s]+\)$/.test(<string> value) || formatId(<string> value) === 'noability') {
          return;
        }

        // always remove the dirtyAbility if the actual ability was revealed
        // (value should be available at this point from the previous check, but we'll check again lol)
        if (value) {
          syncedPokemon.dirtyAbility = null;
        }

        // update the abilityToggled state (always false if not applicable)
        // syncedPokemon.abilityToggled = detectToggledAbility(clientPokemon);

        break;
      }

      case 'item': {
        // ignore any unrevealed item (resulting in a falsy value) that hasn't been knocked-off/consumed/etc.
        // (this can be checked since when the item be consumed, prevItem would NOT be falsy)
        if ((!value || formatId(<string> value) === 'exists') && !clientPokemon?.prevItem) {
          return;
        }

        // clear the dirtyItem if an actual item is revealed or consumed
        // (if value is falsy here, then prevItem must be available from the previous check)
        if (value || (clientPokemon.prevItem && clientPokemon.prevItemEffect)) {
          syncedPokemon.dirtyItem = null;
        }

        // run the item through the dex in case it's formatted as an id
        value = dex?.items.get(<string> value)?.name || value;

        break;
      }

      case 'prevItem': {
        // check if the item was knocked-off and is the same as dirtyItem
        // if so, clear the dirtyItem
        // (note that `value` here is prevItem, NOT item!)
        if (clientPokemon?.prevItemEffect && value === syncedPokemon.dirtyItem) {
          syncedPokemon.dirtyItem = null;
        }

        break;
      }

      case 'boosts': {
        value = PokemonBoostNames.reduce<Showdown.StatsTable>((prev, stat) => {
          // in gen 1, the client may report a SPC boost, which we'll store under SPA
          const clientStat = gen === 1 && stat === 'spa' ? 'spc' : stat;

          const prevBoost = prev[stat];
          const boost = clientPokemon?.boosts?.[clientStat] || 0;

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

      case 'lastMove': {
        // allowing falsy values to enable clearing the lastMove
        if (!value) {
          break;
        }

        const dexMove = dex.moves.get(<string> value);

        if (dexMove?.exists) {
          value = dexMove.name;
        }

        break;
      }

      case 'moveTrack': {
        const {
          moveTrack,
          revealedMoves,
        } = sanitizeMoveTrack(clientPokemon, state?.format);

        value = moveTrack;

        if (revealedMoves.length) {
          syncedPokemon.revealedMoves = revealedMoves;
        }

        if (autoMoves) {
          syncedPokemon.moves = mergeRevealedMoves(syncedPokemon);
        }

        break;
      }

      case 'volatiles': {
        const volatiles = <Showdown.Pokemon['volatiles']> value;

        // sync the Pokemon's dynamax state
        syncedPokemon.useMax = 'dynamax' in volatiles;

        // check for type changes (and apply only when not terastallized)
        // (client reports a 'typechange' volatile when a Pokemon terastallizes)
        const changedTypes = (
          'typechange' in volatiles
            && <Showdown.TypeName[]>volatiles.typechange[1]?.split?.('/') // 'Psychic/Ice' -> ['Psychic', 'Ice']
        ) || [];

        // sync the Pokemon's terastallization state
        // (teraType should've been synced and sanitized from `pokemon` by this point)
        syncedPokemon.terastallized = 'typechange' in volatiles
          && !!syncedPokemon.teraType
          && syncedPokemon.teraType !== '???' // just in case lol
          && PokemonTypes.includes(syncedPokemon.teraType)
          && changedTypes.length === 1
          && changedTypes[0] === syncedPokemon.teraType;

        if (changedTypes.length && !syncedPokemon.terastallized) {
          syncedPokemon.types = [...changedTypes];
        }

        // check for type change resets
        const resetTypes = (
          'typechange' in syncedPokemon.volatiles
            && !changedTypes.length
            && <Showdown.TypeName[]> dex.species.get(syncedPokemon.speciesForme)?.types
        ) || [];

        if (resetTypes?.length) {
          syncedPokemon.types = [...resetTypes];
        }

        // check for type additions (separate from type changes)
        const addedType = (
          'typeadd' in volatiles
            && <Showdown.TypeName> volatiles.typeadd?.[1]
        ) || null;

        if (addedType && !syncedPokemon.types.includes(addedType)) {
          syncedPokemon.types.push(addedType);
        }

        // check for transformations (e.g., from Ditto/Mew)
        const transformedPokemon = (
          'transform' in volatiles
            && <Showdown.Pokemon> <unknown> volatiles.transform?.[1]
        ) || null;

        syncedPokemon.transformedForme = transformedPokemon?.speciesForme || null;

        // check for (untransformed) forme changes
        const formeChange = (
          'formechange' in volatiles
            && volatiles.formechange?.[1]
        ) || null;

        if (!transformedPokemon && formeChange) {
          syncedPokemon.speciesForme = formeChange;

          // update the Pokemon's types to match its new forme types
          const formeTypes = dex.species.get(formeChange)?.types;

          if (formeTypes?.length) {
            syncedPokemon.types = [...formeTypes];
          }
        }

        // note: if the target Pokemon transforms (e.g., Necrozma-Dusk-Mane -> Necrozma-Ultra)
        // on the same turn that the Imposter Pokemon transforms (e.g., Ditto), we'll need to
        // read from 'formechange' instead of 'transform' as the Showdown.Pokemon in 'transform'
        // will refer to its post-changed forme, which the Imposter Pokemon will inherit
        // (i.e., Ditto's transformedForme will be Necrozma-Ultra, which is incorrect)
        if (transformedPokemon && formeChange) {
          syncedPokemon.transformedForme = formeChange;
        }

        // sanitizing to make sure a transformed Pokemon doesn't crash the extension lol
        value = sanitizeVolatiles(clientPokemon);

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

    // sometimes, the server may only provide the baseAbility (w/ an undefined ability)
    const serverAbility = serverPokemon.ability || serverPokemon.baseAbility;

    if (!legacy && serverAbility) {
      const dexAbility = dex.abilities.get(serverAbility);

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
    const guessedSpread = legacy ? guessServerLegacySpread(
      state?.format,
      syncedPokemon,
    ) : guessServerSpread(
      state?.format,
      syncedPokemon,
      state?.format?.includes('random') ? 'Hardy' : undefined,
    );

    // build a preset around the serverPokemon
    const serverPreset: CalcdexPokemonPreset = {
      source: 'server',
      name: 'Yours',
      gen,
      format: state?.format,
      speciesForme: syncedPokemon.speciesForme || serverPokemon.speciesForme,
      level: syncedPokemon.level || serverPokemon.level,
      gender: syncedPokemon.gender || serverPokemon.gender || null,
      ability: syncedPokemon.ability,
      item: syncedPokemon.item,
      ...guessedSpread,
    };

    // in case a post-transformed Ditto breaks the original preset
    const presetValid = (legacy || !!serverPreset.nature)
      && !!Object.keys({ ...serverPreset.ivs, ...(!legacy && serverPreset.evs) }).length;

    if (presetValid) {
      syncedPokemon.ivs = { ...serverPreset.ivs };

      if (!legacy) {
        syncedPokemon.nature = serverPreset.nature;
        syncedPokemon.evs = { ...serverPreset.evs };
      }

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
        // .findIndex((p) => p.name === 'Yours');
        .findIndex((p) => p.source === 'server');

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
    altFormes,
    transformedForme, // yeah ik this is already set above, but double-checking lol
    dirtyAbility,
    abilities,
    transformedAbilities,
    abilityToggleable,
    // abilityToggled, // update (2022/12/09): recalculating this w/ the `field` arg below for gen 9 support
    baseStats,
    transformedBaseStats,
  } = sanitizePokemon(
    syncedPokemon,
    state?.format,
    showAllFormes,
  );

  // update the abilities (including transformedAbilities) if they're different from what was stored prior
  // (note: only checking if they're arrays instead of their length since th ability list could be empty)
  const shouldUpdateAbilities = Array.isArray(abilities)
    && JSON.stringify(abilities) !== JSON.stringify(syncedPokemon.abilities);

  if (shouldUpdateAbilities) {
    syncedPokemon.abilities = [...abilities];
  }

  const shouldUpdateTransformedAbilities = Array.isArray(transformedAbilities)
    && JSON.stringify(transformedAbilities) !== JSON.stringify(syncedPokemon.transformedAbilities);

  if (shouldUpdateTransformedAbilities) {
    syncedPokemon.transformedAbilities = [...transformedAbilities];
  }

  // check for toggleable abilities
  syncedPokemon.abilityToggleable = abilityToggleable;

  if (abilityToggleable) {
    syncedPokemon.abilityToggled = detectToggledAbility(syncedPokemon, state);
  }

  // check if we should set the ability to one of the transformed Pokemon's abilities
  // (only when the Pokemon isn't server-sourced since we don't know what the actual ability was)
  // const shouldUpdateTransformedAbility = !!transformedForme
  //   && !syncedPokemon.serverSourced
  //   && !!transformedAbilities?.length
  //   && (!syncedPokemon.ability || !transformedAbilities.includes(syncedPokemon.dirtyAbility));

  if (dirtyAbility && syncedPokemon.dirtyAbility !== dirtyAbility) {
    // [syncedPokemon.dirtyAbility] = transformedAbilities;
    syncedPokemon.dirtyAbility = dirtyAbility;
  }

  if (syncedPokemon.ability && syncedPokemon.ability === syncedPokemon.dirtyAbility) {
    syncedPokemon.dirtyAbility = null;
  }

  // check for base stats (in case of forme changes)
  if (Object.values(baseStats).filter(Boolean).length) {
    syncedPokemon.baseStats = { ...baseStats };
  }

  // check for alternative formes (in case of transformations)
  if (altFormes?.length) {
    // ya, apparently Hisuian Pokemon are included in the list for some reason lol
    syncedPokemon.altFormes = [...altFormes];

    if (syncedPokemon.altFormes.length === 1) {
      syncedPokemon.altFormes = [];
    }
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

  // exhibit the big smart sync technology by utilizing the power of hardcoded game sense
  // for the Protosynthesis/Quark Drive abilities (gen 9)
  if (state?.gen > 8) {
    const ability = formatId(syncedPokemon.dirtyAbility || syncedPokemon.ability);
    const dirtyItem = formatId(syncedPokemon.dirtyItem);

    // determine if we should remove the dirty "Booster Energy" item
    if (['protosynthesis', 'quarkdrive'].includes(ability) && dirtyItem === 'boosterenergy') {
      const hasBoosterVolatile = Object.keys(syncedPokemon.volatiles)
        .some((k) => /^(?:proto|quark)/i.test(k));

      const removeDirtyBooster = !hasBoosterVolatile && (
        (ability === 'protosynthesis' && ['Sun', 'Harsh Sunshine'].includes(state.field?.weather))
          || (ability === 'quarkdrive' && state.field?.terrain !== 'Electric')
      );

      if (removeDirtyBooster) {
        // altItems could be potentially sorted by usage stats from the Calcdex
        syncedPokemon.dirtyItem = (
          !!syncedPokemon.altItems?.length
            && flattenAlts(syncedPokemon.altItems).find((i) => !!i && formatId(i) !== 'boosterenergy')
        ) || null;

        syncedPokemon.abilityToggled = false;
      }
    }
  }

  // recalculate the spread stats
  // (calcPokemonSpredStats() will determine whether to use the transformedBaseStats or baseStats)
  syncedPokemon.spreadStats = calcPokemonSpreadStats(state?.format, syncedPokemon);

  // we're done! ... I think
  return syncedPokemon;
};
