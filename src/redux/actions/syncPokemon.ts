import {
  type AbilityName,
  // type GameType,
  type GenerationNum,
  type ItemName,
  type MoveName,
  type Terrain,
  type Weather,
} from '@smogon/calc';
import {
  PokemonBoosterAbilities,
  PokemonBoostNames,
  PokemonTypes,
} from '@showdex/consts/dex';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import {
  clonePokemon,
  mergeRevealedMoves,
  sanitizePokemon,
  sanitizeMoveTrack,
  sanitizeVolatiles,
} from '@showdex/utils/battle';
import { calcPokemonSpreadStats } from '@showdex/utils/calc';
import {
  // diffArrays,
  env,
  formatId,
  nonEmptyObject,
  similarArrays,
} from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import {
  detectGenFromFormat,
  detectLegacyGen,
  getDexForFormat,
  // toggleableAbility,
} from '@showdex/utils/dex';
import { capitalize } from '@showdex/utils/humanize';
import { flattenAlts } from '@showdex/utils/presets';

// const l = logger('@showdex/redux/actions/syncPokemon()');

export const syncPokemon = (
  pokemon: CalcdexPokemon,
  config?: {
    format: string;
    // gameType?: GameType;
    clientPokemon: Partial<Showdown.Pokemon>;
    serverPokemon?: Showdown.ServerPokemon;
    weather?: Weather;
    terrain?: Terrain;
    autoMoves?: boolean;
  },
): CalcdexPokemon => {
  const {
    format,
    // gameType,
    clientPokemon,
    serverPokemon,
    weather,
    terrain,
    autoMoves,
  } = config || {};

  const dex = getDexForFormat(format);
  const legacy = detectLegacyGen(format);
  const gen = detectGenFromFormat(format, env.int<GenerationNum>('calcdex-default-gen'));

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
              ...(Object.values(updatedSpecies.abilities) as AbilityName[]),
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
        } = sanitizeMoveTrack(clientPokemon, format);

        value = moveTrack;

        if (syncedPokemon.serverSourced) {
          break;
        }

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
          // e.g., 'Psychic/Ice' -> ['Psychic', 'Ice']
          'typechange' in volatiles
            && volatiles.typechange[1]?.split?.('/') as Showdown.TypeName[]
        ) || [];

        // sync the Pokemon's terastallization state
        // (teraType should've been synced and sanitized from `pokemon` by this point)
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

        const transformedForme = transformedPokemon?.speciesForme;

        // will be reset by the auto-preset effect in useCalcdexPresets()
        const shouldResetPreset = !!syncedPokemon.presetId && (
          (!syncedPokemon.transformedForme && !!transformedForme)
            || (!!syncedPokemon.transformedForme && !transformedForme)
        );

        if (shouldResetPreset) {
          syncedPokemon.presetId = null;
          syncedPokemon.autoPreset = true;
        }

        syncedPokemon.transformedForme = transformedForme || null;
        syncedPokemon.transformedLevel = transformedPokemon?.level || null;

        // check for (untransformed) forme changes
        const formeChange = (
          'formechange' in volatiles
            && volatiles.formechange?.[1]
        ) || null;

        if (!transformedForme && formeChange) {
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
      syncedPokemon.revealedTeraType = serverPokemon.teraType;
    }

    // sometimes, the server may only provide the baseAbility (w/ an undefined ability)
    const serverAbility = serverPokemon.ability || serverPokemon.baseAbility;

    if (!legacy && serverAbility) {
      const dexAbility = dex.abilities.get(serverAbility);

      if (dexAbility?.name) {
        syncedPokemon.ability = dexAbility.name as AbilityName;
        syncedPokemon.dirtyAbility = null;
      }
    }

    if (serverPokemon.item) {
      const dexItem = dex.items.get(serverPokemon.item);

      if (dexItem?.name) {
        syncedPokemon.item = dexItem.name as ItemName;
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
    const serverMoves = serverPokemon.moves
      ?.map((id) => dex.moves.get(id)?.name as MoveName)
      .filter(Boolean);

    // set the serverMoves/transformedMoves if available
    // (& not transformed, otherwise, serverMoves[] will be of the Transform-target Pokemon's moves!!)
    const shouldUpdateServerMoves = !!serverMoves?.length
      && !syncedPokemon.serverMoves?.length
      && !syncedPokemon.transformedForme;

    if (shouldUpdateServerMoves) {
      // const transformed = !!syncedPokemon.transformedForme || 'transform' in (clientPokemon?.volatiles || {});
      // const moveKey = transformed ? 'transformedMoves' : 'serverMoves';

      // syncedPokemon[moveKey] = [...serverMoves];
      syncedPokemon.serverMoves = [...serverMoves];
    }

    syncedPokemon.transformedMoves = [
      ...(serverMoves?.length && syncedPokemon.transformedForme ? serverMoves : []),
    ];
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
    // abilityToggleable, // update (2023/10/09): there's now a `gameType` arg to toggleableAbility() lol
    // abilityToggled, // update (2022/12/09): recalculating this w/ the `field` arg below for gen 9 support
    baseStats,
    transformedBaseStats,
  } = sanitizePokemon(
    syncedPokemon,
    format,
  );

  // clear the dirtyTypes (only if it's populated) if sanitizePokemon() cleared them
  if (syncedPokemon.dirtyTypes.length && !dirtyTypes.length) {
    syncedPokemon.dirtyTypes = [];
  }

  // update the abilities (including transformedAbilities) if they're different from what was stored prior
  // (note: only checking if they're arrays instead of their length since th ability list could be empty)
  const shouldUpdateAbilities = Array.isArray(abilities)
    && !similarArrays(abilities, syncedPokemon.abilities);

  if (shouldUpdateAbilities) {
    syncedPokemon.abilities = [...abilities];
  }

  const shouldUpdateTransformedAbilities = Array.isArray(transformedAbilities)
    && !similarArrays(transformedAbilities, syncedPokemon.transformedAbilities);

  if (shouldUpdateTransformedAbilities) {
    syncedPokemon.transformedAbilities = [...transformedAbilities];
  }

  // check for toggleable abilities
  // update (2023/10/18): abilityToggleable is now deprecated & directly determined by PokeInfo during renders
  // syncedPokemon.abilityToggleable = toggleableAbility(syncedPokemon, gameType);

  if (syncedPokemon.dirtyAbility !== dirtyAbility) {
    // [syncedPokemon.dirtyAbility] = transformedAbilities;
    syncedPokemon.dirtyAbility = dirtyAbility;
  }

  if (syncedPokemon.ability && syncedPokemon.ability === syncedPokemon.dirtyAbility) {
    syncedPokemon.dirtyAbility = null;
  }

  // check for base stats (in case of forme changes)
  if (nonEmptyObject(baseStats)) {
    syncedPokemon.baseStats = { ...baseStats };
  }

  // check for alternative formes (in case of transformations)
  if (altFormes?.length) {
    syncedPokemon.altFormes = [...altFormes];
  }

  // check for transformed base stats
  syncedPokemon.transformedBaseStats = (
    transformedForme
      && nonEmptyObject(transformedBaseStats)
      && { ...transformedBaseStats }
  ) || null;

  // clear the list of transformed moves if the Pokemon is no longer transformed
  // (this one applies to both client [i.e., non-serverSourced] & [redundantly] serverSourced syncedPokemon)
  if (!transformedForme) {
    syncedPokemon.transformedMoves = [];
  }

  // if the Pokemon is transformed, auto-set the moves
  if (syncedPokemon.transformedMoves?.length) {
    syncedPokemon.moves = syncedPokemon.serverSourced
      ? [...syncedPokemon.transformedMoves]
      : mergeRevealedMoves(syncedPokemon);
  }

  // exhibit the big smart sync technology by utilizing the power of hardcoded game sense for Protosynthesis/Quark Drive,
  // i.e., remove the Booster Energy **dirtyItem** & select the next item in altItems[] if the Pokemon doesn't have an
  // active booster volatile (e.g., 'protosynthesisatk') & field conditions aren't met, which is to say they're probably
  // not running Booster Energy on that Pokemon
  const removeDirtyBooster = gen > 8
    && PokemonBoosterAbilities.includes(syncedPokemon.dirtyAbility || syncedPokemon.ability)
    && syncedPokemon.dirtyItem === 'Booster Energy' as ItemName
    && !Object.keys(syncedPokemon.volatiles)
      .some((k) => k.startsWith(formatId(syncedPokemon.dirtyAbility || syncedPokemon.ability)))
    && (
      (syncedPokemon.dirtyAbility || syncedPokemon.ability) !== 'Protosynthesis' as AbilityName
        // || !(['Sun', 'Harsh Sunshine'] as Weather[]).includes(weather)
        || weather !== 'Sun' as Weather
    )
    && (
      (syncedPokemon.dirtyAbility || syncedPokemon.ability) !== 'Quark Drive' as AbilityName
        || terrain !== 'Electric' as Terrain
    );

  if (removeDirtyBooster) {
    // altItems could be potentially sorted by usage stats from the Calcdex
    syncedPokemon.dirtyItem = (
      !!syncedPokemon.altItems?.length
      && flattenAlts(syncedPokemon.altItems)
        .find((item) => item !== 'Booster Energy' as ItemName)
    ) || null;

    // could've been previously toggled, so make sure the ability is toggled off
    syncedPokemon.abilityToggled = false;
  }

  // recalculate the spread stats
  // (calcPokemonSpredStats() will determine whether to use the transformedBaseStats or baseStats)
  syncedPokemon.spreadStats = calcPokemonSpreadStats(format, syncedPokemon);

  // we're done! ... I think
  return syncedPokemon;
};
