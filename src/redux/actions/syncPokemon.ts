import { type GenerationNum } from '@smogon/calc';
import { PokemonBoostNames, PokemonTypes } from '@showdex/consts/dex';
import {
  type CalcdexBattleState,
  type CalcdexPokemon,
  type CalcdexPokemonPreset,
} from '@showdex/redux/store';
import {
  clonePokemon,
  detectToggledAbility,
  mergeRevealedMoves,
  sanitizePokemon,
  sanitizeMoveTrack,
  sanitizeVolatiles,
} from '@showdex/utils/battle';
import {
  calcPokemonSpreadStats,
  calcPresetCalcdexId,
  guessServerLegacySpread,
  guessServerSpread,
} from '@showdex/utils/calc';
import {
  diffArrays,
  env,
  formatId,
  nonEmptyObject,
} from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import { detectGenFromFormat, detectLegacyGen, getDexForFormat } from '@showdex/utils/dex';
import { capitalize } from '@showdex/utils/humanize';
import { flattenAlts, guessTeambuilderPreset } from '@showdex/utils/presets';

// const l = logger('@showdex/redux/actions/syncPokemon()');

export const syncPokemon = (
  pokemon: CalcdexPokemon,
  clientPokemon: DeepPartial<Showdown.Pokemon>,
  serverPokemon?: DeepPartial<Showdown.ServerPokemon>,
  state?: CalcdexBattleState,
  autoMoves?: boolean,
  teambuilderPresets?: CalcdexPokemonPreset[],
): CalcdexPokemon => {
  const dex = getDexForFormat(state?.format);
  const legacy = detectLegacyGen(state?.format);
  const gen = detectGenFromFormat(state?.format, env.int<GenerationNum>('calcdex-default-gen'));

  // final synced Pokemon that will be returned at the end
  // update (2023/07/18): structuredClone() is slow af, so removing it from the codebase
  // const syncedPokemon = structuredClone(pokemon) || {};
  const syncedPokemon = clonePokemon(pokemon);

  // you should not be looping through any special CalcdexPokemon-specific properties here!
  ([
    'name',
    'speciesForme',
    'hp',
    'maxhp',
    'terastallized', // must be before 'volatiles' (in terms of array indices) !!!
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
  ] as (keyof NonFunctionProperties<Showdown.Pokemon>)[]).forEach((key) => {
    const prevValue = syncedPokemon[key as keyof CalcdexPokemon];
    let value = clientPokemon?.[key];

    // note: this will accept null values!
    if (value === undefined) {
      return;
    }

    switch (key) {
      case 'speciesForme': {
        // e.g., 'Urshifu-*' -> 'Urshifu' (to fix forme switching, which is prevented due to the wildcard forme)
        value = (value as string).replace('-*', '');

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

          if (nonEmptyObject(updatedSpecies?.abilities)) {
            syncedPokemon.abilities = [
              ...(Object.values(updatedSpecies.abilities) as CalcdexPokemon['abilities']),
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

      case 'terastallized': {
        // replace a potentially empty string (or something potentially invalid like `false`) with null
        // (also no point storing a '???' type; null is perfectly acceptable since the UI should show '???' for falsy values)
        // update (2022/12/12): don't sync falsy values; clears your Pokemon's Tera types! LOL
        if (!value || value === '???') {
          // value = null;
          syncedPokemon.terastallized = false;

          // break;
          return;
        }

        // make sure we got a valid type (just in case)
        // (note: value can't be '???' here at this point)
        value = capitalize(value as string);
        syncedPokemon.terastallized = PokemonTypes.includes(value as Showdown.TypeName);

        if (!syncedPokemon.terastallized) {
          return;
        }

        syncedPokemon.revealedTeraType = value as Showdown.TypeName;
        syncedPokemon.teraType = syncedPokemon.revealedTeraType;

        // break;
        return;
      }

      case 'status': {
        // remove the Pokemon's status if fainted
        if (!syncedPokemon.hp) {
          value = null;
        }

        break;
      }

      case 'statusData': {
        const statusData = value as Showdown.Pokemon['statusData'];

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
        if (!value || /^\([\w\s]+\)$/.test(value as string) || formatId(value as string) === 'noability') {
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
        if ((!value || formatId(value as string) === 'exists') && !clientPokemon?.prevItem) {
          return;
        }

        // clear the dirtyItem if an actual item is revealed or consumed
        // (if value is falsy here, then prevItem must be available from the previous check)
        if (value || (clientPokemon.prevItem && clientPokemon.prevItemEffect)) {
          syncedPokemon.dirtyItem = null;
        }

        // run the item through the dex in case it's formatted as an id
        value = dex?.items.get(value as string)?.name || value;

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

      case 'lastMove': {
        // allowing falsy values to enable clearing the lastMove
        if (!value) {
          break;
        }

        const dexMove = dex.moves.get(value as string);

        if (dexMove?.exists) {
          value = dexMove.name;
        }

        break;
      }

      case 'moveTrack': {
        const {
          moveTrack,
          revealedMoves,
          transformedMoves,
        } = sanitizeMoveTrack(clientPokemon, state?.format);

        value = moveTrack;

        syncedPokemon.revealedMoves = revealedMoves;
        syncedPokemon.transformedMoves = transformedMoves;

        if (autoMoves) {
          syncedPokemon.moves = mergeRevealedMoves(syncedPokemon);
        }

        break;
      }

      case 'volatiles': {
        const volatiles = value as Showdown.Pokemon['volatiles'];

        // sync the Pokemon's dynamax state
        syncedPokemon.useMax = 'dynamax' in volatiles;

        // check for type changes (and apply only when not terastallized)
        // (client reports a 'typechange' volatile when a Pokemon terastallizes)
        const changedTypes = (
          // 'Psychic/Ice' -> ['Psychic', 'Ice']
          'typechange' in volatiles
            && volatiles.typechange[1]?.split?.('/') as Showdown.TypeName[]
        ) || [];

        // sync the Pokemon's terastallization state
        // (teraType should've been synced and sanitized from `pokemon` by this point)
        // syncedPokemon.terastallized = 'typechange' in volatiles
        //   && !!syncedPokemon.teraType
        //   && syncedPokemon.teraType !== '???' // just in case lol
        //   && PokemonTypes.includes(syncedPokemon.teraType)
        //   && changedTypes.length === 1
        //   && changedTypes[0] === syncedPokemon.teraType;

        if (changedTypes.length && !syncedPokemon.terastallized) {
          syncedPokemon.types = [...changedTypes];
        }

        // check for type change resets
        const resetTypes = (
          'typechange' in syncedPokemon.volatiles
            && !changedTypes.length
            && dex.species.get(syncedPokemon.speciesForme)?.types as Showdown.TypeName[]
        ) || [];

        if (resetTypes?.length) {
          syncedPokemon.types = [...resetTypes];
        }

        // check for type additions (separate from type changes)
        const addedType = (
          'typeadd' in volatiles
            && volatiles.typeadd?.[1] as Showdown.TypeName
        ) || null;

        if (addedType && !syncedPokemon.types.includes(addedType)) {
          syncedPokemon.types.push(addedType);
        }

        // check for transformations (e.g., from Ditto/Mew)
        const transformedPokemon = (
          'transform' in volatiles
            && volatiles.transform?.[1] as unknown as Showdown.Pokemon
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

        // check for Protosynthesis & Quark Drive boosted stats
        const boosterVolatile = Object.keys(volatiles)
          .find((k) => /^(?:proto|quark)/i.test(k));

        syncedPokemon.boostedStat = (
          // e.g., 'protosynthesisatk' -> 'atk'
          !!boosterVolatile
            && boosterVolatile.replace(/^(?:protosynthesis|quarkdrive)/i, '')
        ) as Showdown.StatNameNoHp || null;

        // check for a server-reported faintCounter
        // e.g., { fallen1: ['fallen1'] }
        const fallenVolatile = Object.keys(volatiles).find((k) => k?.startsWith('fallen'));
        const faintCounter = parseInt(fallenVolatile?.replace('fallen', ''), 10) || 0; // e.g., 'fallen1' -> 1

        if (faintCounter) {
          syncedPokemon.faintCounter = faintCounter;

          // auto-clear the dirtyFaintCounter if the user previously set one
          if (typeof syncedPokemon.dirtyFaintCounter === 'number') {
            syncedPokemon.dirtyFaintCounter = null;
          }
        }

        // sanitizing to make sure a transformed Pokemon doesn't crash the extension lol
        value = sanitizeVolatiles(clientPokemon);

        // update (2023/07/27): there's an interesting interaction between Transform & Power Trick:
        // if the Pokemon transforms into a Pokemon w/ Power Trick active, they won't receive the 'powertrick' volatile,
        // but the copied stats from the transformed Pokemon will have its ATK/DEF swapped. a cool trick we can probably
        // safely do is detect if the transformedPokemon has the 'powertrick' volatile, then apply it to this Pokemon
        if (nonEmptyObject(transformedPokemon?.volatiles) && 'powertrick' in transformedPokemon.volatiles) {
          (value as CalcdexPokemon['volatiles']).powertrick = ['powertrick'];
        }

        break;
      }

      default: {
        break;
      }
    }

    // update (2023/07/18): storing the value like this so we don't have to run JSON.stringify()
    // again below when we set syncedPokemon[key] (rather, just simply passing it to JSON.parse())
    const stringifiedValue = JSON.stringify(value);

    if (stringifiedValue === JSON.stringify(prevValue)) { // kekw
      return;
    }

    // update (2023/07/18): structuredClone() is slow af, so removing it from the codebase;
    // since we're already using JSON.stringify(), might as well just use JSON.parse() for now
    // (not that fast either, but much, much faster than structuredClone() !!)
    syncedPokemon[key] = typeof value === 'object' // can be null btw
      ? JSON.parse(stringifiedValue) as typeof value // JSON.parse(null) === null
      : value;
  });

  // fill in some additional fields if the serverPokemon was provided
  if (serverPokemon?.ident) {
    // should always be the case, idk why it shouldn't be (but you know we gotta check)
    if (typeof serverPokemon.hp === 'number' && typeof serverPokemon.maxhp === 'number') {
      syncedPokemon.hp = serverPokemon.hp;

      // make sure `maxhp` isn't a percentage (which is usually the case with dead Pokemon, i.e., 0% HP)
      // (this isn't foolproof tho cause there could be instances where the `maxhp` is legit 100 lol)
      if (serverPokemon.hp || serverPokemon.maxhp !== 100) {
        syncedPokemon.maxhp = serverPokemon.maxhp;
      }

      // serverSourced is used primarily as a flag to distinguish `hp` as the actual value or as a percentage
      // (but since this conditional should always succeed in theory, should be ok to use to distinguish other properties)
      syncedPokemon.serverSourced = true;
    }

    // check if the Tera type has been revealed
    if (serverPokemon.teraType && serverPokemon.teraType !== '???') {
      syncedPokemon.teraType = serverPokemon.teraType;
    }

    // sometimes, the server may only provide the baseAbility (w/ an undefined ability)
    const serverAbility = serverPokemon.ability || serverPokemon.baseAbility;

    if (!legacy && serverAbility) {
      const dexAbility = dex.abilities.get(serverAbility);

      if (dexAbility?.name) {
        syncedPokemon.ability = dexAbility.name as CalcdexPokemon['ability'];
        syncedPokemon.dirtyAbility = null;
      }
    }

    if (serverPokemon.item) {
      const dexItem = Dex.items.get(serverPokemon.item);

      if (dexItem?.name) {
        syncedPokemon.item = dexItem.name as CalcdexPokemon['item'];
        syncedPokemon.dirtyItem = null;
      }
    }

    // copy the server stats for more accurate final stats calculations
    if (!nonEmptyObject(syncedPokemon.serverStats) && nonEmptyObject(serverPokemon.stats)) {
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

      return dexMove.name as CalcdexPokemon['serverMoves'][0];
    }).filter(Boolean);

    // set the serverMoves/transformedMoves if available
    if (serverMoves?.length) {
      const moveKey = syncedPokemon.transformedForme
        ? 'transformedMoves'
        : 'serverMoves';

      syncedPokemon[moveKey] = [...serverMoves];
    }

    // since the server doesn't send us the Pokemon's EVs/IVs/nature, we gotta find it ourselves,
    // either from the Teambuilder presets (if enabled) or guessing the spread
    if (!syncedPokemon.presetId) {
      let serverPreset: CalcdexPokemonPreset = null;

      // first, attempt to find a matching Teambuilder preset, if provided
      // (will only be provided once per non-Randoms battle, resulting in an empty array on subsequent syncs)
      if (teambuilderPresets?.length) {
        serverPreset = guessTeambuilderPreset(
          teambuilderPresets,
          syncedPokemon,
          state?.format,
        );
      }

      // at this point, if the serverPreset wasn't found, guess the spread and make a preset out of it
      if (!serverPreset) {
        // update (2023/01/03): apparently this part was running on every sync, so added the serverSourced check
        // to make sure it only fires once (might help with the lag now that the spread guesser won't fire all the time)
        const guessedSpread = legacy ? guessServerLegacySpread(
          state?.format,
          syncedPokemon,
        ) : guessServerSpread(
          state?.format,
          syncedPokemon,
          state?.format?.includes('random') ? 'Hardy' : undefined,
        );

        // build a preset around the serverPokemon
        serverPreset = {
          calcdexId: null,
          id: null,
          source: 'server',
          name: 'Yours',
          gen,
          format: state?.format,
          speciesForme: syncedPokemon.speciesForme || serverPokemon.speciesForme,
          level: syncedPokemon.level || serverPokemon.level,
          gender: syncedPokemon.gender || serverPokemon.gender || null,
          teraTypes: [serverPokemon.teraType].filter(Boolean) as Showdown.TypeName[],
          ability: syncedPokemon.ability,
          item: syncedPokemon.item,
          ...guessedSpread,
        };

        serverPreset.calcdexId = calcPresetCalcdexId(serverPreset);
        serverPreset.id = serverPreset.calcdexId;
      }

      // in case a post-transformed Ditto breaks the original preset
      const presetValid = (legacy || !!serverPreset.nature)
        && nonEmptyObject({ ...serverPreset.ivs, ...serverPreset.evs });

      // apply the serverPreset if it's valid
      if (presetValid) {
        syncedPokemon.ivs = { ...serverPreset.ivs };
        syncedPokemon.evs = { ...serverPreset.evs };

        if (!legacy) {
          syncedPokemon.nature = serverPreset.nature;
        }

        // calculate the stats with the EVs/IVs from the server preset
        // (note: same thing happens in applyPreset() in PokeInfo since the EVs/IVs from the preset are now available)
        // (update: we calculate this at the end now, before syncedPokemon is returned)
        // if (typeof dex?.stats?.calc === 'function') {
        //   syncedPokemon.spreadStats = calcPokemonSpreadStats(dex, syncedPokemon);
        // }

        // perform additional processing for the 'Yours' presets only (non-storage & storage-box presets)
        if (serverPreset.source === 'server') {
          // need to do some special processing for moves
          // e.g., serverPokemon.moves = ['calmmind', 'moonblast', 'flamethrower', 'thunderbolt']
          // what we want: ['Calm Mind', 'Moonblast', 'Flamethrower', 'Thunderbolt']
          if (serverMoves?.length) {
            serverPreset.moves = [...serverMoves];
          }

          // add the 'Yours' preset (source: 'server') if we haven't found a Teambuilder preset (source: 'storage') yet
          // (technically, this should be a one-time thing, but if not, we'll at least want only have 1 'Yours' preset)
          const serverPresetIndex = syncedPokemon.presets
            .findIndex((p) => p.source === 'server');

          if (serverPresetIndex > -1) {
            syncedPokemon.presets[serverPresetIndex] = serverPreset;
          } else {
            syncedPokemon.presets.unshift(serverPreset);
          }
        }

        if (serverPreset.moves?.length) {
          syncedPokemon.moves = [...serverPreset.moves];
        }

        // disabling autoPreset since we already set the preset here
        // (also tells PokeInfo not to apply the first preset)
        syncedPokemon.presetId = serverPreset.calcdexId;
        syncedPokemon.autoPreset = false;
      }
    }
  }

  // only using sanitizePokemon() to get some values back
  // (is this a good idea? idk)
  const {
    altFormes,
    transformedForme, // yeah ik this is already set above, but double-checking lol
    dirtyTypes,
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
    /** @todo As of 2023/01/05, this is no longer a setting; remove this argument (`showAllFormes`)! */
    true,
  );

  // clear the dirtyTypes (only if it's populated) if sanitizePokemon() cleared them
  if (syncedPokemon.dirtyTypes.length && !dirtyTypes.length) {
    syncedPokemon.dirtyTypes = [];
  }

  // update the abilities (including transformedAbilities) if they're different from what was stored prior
  // (note: only checking if they're arrays instead of their length since th ability list could be empty)
  const shouldUpdateAbilities = Array.isArray(abilities)
    && !!diffArrays(abilities, syncedPokemon.abilities)?.length;

  if (shouldUpdateAbilities) {
    syncedPokemon.abilities = [...abilities];
  }

  const shouldUpdateTransformedAbilities = Array.isArray(transformedAbilities)
    && !!diffArrays(transformedAbilities, syncedPokemon.transformedAbilities)?.length;

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

  if (!!transformedForme && dirtyAbility && syncedPokemon.dirtyAbility !== dirtyAbility) {
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
  if (syncedPokemon.transformedMoves?.length) {
    if (transformedForme) {
      // update (2023/07/27): mergeRevealedMoves() now handles transformedMoves, so we'll use that instead
      // syncedPokemon.moves = [...syncedPokemon.transformedMoves];
      syncedPokemon.moves = mergeRevealedMoves(syncedPokemon);
    } else {
      // clear the list of transformed moves since the Pokemon is no longer transformed
      syncedPokemon.transformedMoves = [];
    }
  }

  // exhibit the big smart sync technology by utilizing the power of hardcoded game sense
  // for the Protosynthesis/Quark Drive abilities (gen 9)
  if (state?.gen > 8) {
    const { field } = state;
    const ability = formatId(syncedPokemon.dirtyAbility || syncedPokemon.ability);
    const dirtyItem = formatId(syncedPokemon.dirtyItem);

    // determine if we should remove the dirty "Booster Energy" item
    if (['protosynthesis', 'quarkdrive'].includes(ability) && dirtyItem === 'boosterenergy') {
      const hasBoosterVolatile = Object.keys(syncedPokemon.volatiles)
        .some((k) => /^proto|quark/i.test(k));

      // only remove the item if the Pokemon does not have the volatile and the field conditions aren't met
      const removeDirtyBooster = !hasBoosterVolatile && (
        (ability === 'protosynthesis' && !['Sun', 'Harsh Sunshine'].includes(field?.weather))
          || (ability === 'quarkdrive' && field?.terrain !== 'Electric')
      );

      // if we should remove the item, select the next non-"Booster Energy" item
      if (removeDirtyBooster) {
        // altItems could be potentially sorted by usage stats from the Calcdex
        syncedPokemon.dirtyItem = (
          !!syncedPokemon.altItems?.length
            && flattenAlts(syncedPokemon.altItems).find((i) => !!i && formatId(i) !== 'boosterenergy')
        ) || null;

        // could've been previously toggled, so make sure the ability is toggled off
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
