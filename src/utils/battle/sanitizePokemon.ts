import { type AbilityName, type GenerationNum, type ItemName } from '@smogon/calc';
import { PokemonBoostNames, PokemonNatures, PokemonStatNames } from '@showdex/consts/dex';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { calcPokemonCalcdexId, populateStatsTable } from '@showdex/utils/calc';
import {
  clamp,
  env,
  formatId,
  nonEmptyObject,
  similarArrays,
} from '@showdex/utils/core';
import { detectGenFromFormat, detectLegacyGen, getDexForFormat } from '@showdex/utils/dex';
import { flattenAlts } from '@showdex/utils/presets';
import { detectPlayerKeyFromPokemon } from './detectPlayerKey';
import { detectPokemonIdent } from './detectPokemonIdent';
import { detectSpeciesForme } from './detectSpeciesForme';
import { detectToggledAbility } from './detectToggledAbility';
import { sanitizeMoveTrack } from './sanitizeMoveTrack';
import { sanitizeVolatiles } from './sanitizeVolatiles';

/* eslint-disable @typescript-eslint/indent */

/**
 * Essentially converts a `Showdown.Pokemon` into our custom `CalcdexPokemon`.
 *
 * * Gets in *R E A L / D E E P*.
 *   - Sanitizes the living shit out of the `pokemon`.
 * * You can also pass in an incomplete `CalcdexPokemon`,
 *   which will fill in defaults for any missing properties.
 *   - Technically, nothing is required, so you can pass in no arguments and
 *     still get a partially filled-in `CalcdexPokemon`.
 *
 * @todo needs some mclovin with a nice scrubbin
 * @since 0.1.0
 */
export const sanitizePokemon = <
  TPokemon extends Partial<Showdown.PokemonDetails>,
>(
  pokemon?: TPokemon,
  format?: string | GenerationNum,
  // showAllFormes?: boolean,
): CalcdexPokemon => {
  const dex = getDexForFormat(format);
  const gen = detectGenFromFormat(format, env.int<GenerationNum>('calcdex-default-gen'));
  const legacy = detectLegacyGen(format);

  // hmm... need to clean this file up lol
  const typeChanged = !!(pokemon as Partial<Showdown.Pokemon>)?.volatiles?.typechange?.[1];
  const transformed = !!(pokemon as Partial<Showdown.Pokemon>)?.volatiles?.transform?.[1];

  const sanitizedPokemon: CalcdexPokemon = {
    calcdexId: (pokemon as Partial<CalcdexPokemon>)?.calcdexId || null,
    source: (pokemon as Partial<CalcdexPokemon>)?.source || null,
    playerKey: (pokemon as Partial<CalcdexPokemon>)?.playerKey || detectPlayerKeyFromPokemon(pokemon),

    slot: (pokemon as Partial<Showdown.Pokemon>)?.slot ?? null, // could be 0, so don't use logical OR here
    ident: detectPokemonIdent(pokemon),
    name: pokemon?.name,
    details: pokemon?.details || null,
    searchid: pokemon?.searchid || null,
    active: (pokemon as Partial<CalcdexPokemon>)?.active || false,

    speciesForme: detectSpeciesForme(pokemon)?.replace('-*', ''),
    altFormes: (pokemon as Partial<CalcdexPokemon>)?.altFormes || [],
    transformedForme: (
      transformed
        ? typeof (pokemon as Partial<Showdown.Pokemon>).volatiles.transform[1] === 'object'
          ? ((pokemon as Partial<Showdown.Pokemon>).volatiles.transform[1] as unknown as Showdown.Pokemon)?.speciesForme
          : (pokemon as Partial<Showdown.Pokemon>).volatiles.transform[1]
        : null
    ) || null,

    level: pokemon?.level || 0,
    transformedLevel: (pokemon as Partial<CalcdexPokemon>)?.transformedLevel || null,
    gender: pokemon?.gender || 'N',
    shiny: pokemon?.shiny || false,

    dmaxable: (gen > 7 && (pokemon as Partial<CalcdexPokemon>)?.dmaxable) || false,
    gmaxable: (gen > 7 && (pokemon as Partial<CalcdexPokemon>)?.gmaxable) || false,

    types: (
      typeChanged
        ? (pokemon as Partial<Showdown.Pokemon>).volatiles.typechange[1].split('/')
        : (pokemon as Partial<CalcdexPokemon>)?.types
    ) as Showdown.TypeName[] || [],

    dirtyTypes: (pokemon as Partial<CalcdexPokemon>)?.dirtyTypes || [],

    teraType: (
      typeof (pokemon as Partial<Showdown.Pokemon>)?.terastallized === 'string'
        && (pokemon as Partial<Showdown.Pokemon>).terastallized
    )
      || (pokemon as Partial<CalcdexPokemon>)?.teraType
      || null,

    dirtyTeraType: (pokemon as Partial<CalcdexPokemon>)?.dirtyTeraType || null,
    altTeraTypes: (pokemon as Partial<CalcdexPokemon>)?.altTeraTypes || [],

    hp: (pokemon as Partial<Showdown.Pokemon>)?.hp ?? 100,
    dirtyHp: (pokemon as Partial<CalcdexPokemon>)?.dirtyHp ?? null, // note: 0 = fainted, so null is when the user resets back to `hp`
    maxhp: (pokemon as Partial<Showdown.Pokemon>)?.maxhp || 100,
    fainted: !(pokemon as Partial<Showdown.Pokemon>)?.hp,

    baseAbility: (pokemon as Partial<Showdown.Pokemon>)?.baseAbility?.replace(/no\s?ability/i, '') as AbilityName,
    ability: (!legacy && (pokemon as Partial<CalcdexPokemon>)?.ability) || null,
    dirtyAbility: (pokemon as Partial<CalcdexPokemon>)?.dirtyAbility || null,
    abilityToggled: (pokemon as Partial<CalcdexPokemon>)?.abilityToggled || false,
    abilities: (!legacy && (pokemon as Partial<CalcdexPokemon>)?.abilities) || [],
    altAbilities: (!legacy && (pokemon as Partial<CalcdexPokemon>)?.altAbilities) || [],
    transformedAbilities: (!legacy && (pokemon as Partial<CalcdexPokemon>)?.transformedAbilities) || [],

    item: (
      gen > 1
        && !!(pokemon as Partial<Showdown.Pokemon>)?.item
        && dex.items.get(
          (pokemon as Partial<Showdown.Pokemon>).item
            .replace('(exists)', ''),
        )?.name as ItemName
    ) || null,

    dirtyItem: (pokemon as Partial<CalcdexPokemon>)?.dirtyItem || null,
    altItems: (gen > 1 && (pokemon as Partial<CalcdexPokemon>)?.altItems) || [],
    itemEffect: (pokemon as Partial<Showdown.Pokemon>)?.itemEffect || null,
    prevItem: (pokemon as Partial<Showdown.Pokemon>)?.prevItem as ItemName || null,
    prevItemEffect: (pokemon as Partial<Showdown.Pokemon>)?.prevItemEffect || null,

    nature: (!legacy && ((pokemon as Partial<CalcdexPokemon>)?.nature || PokemonNatures.slice(-1)[0])) || null,
    ivs: populateStatsTable((pokemon as Partial<CalcdexPokemon>)?.ivs, { spread: 'iv', format }),
    evs: populateStatsTable((pokemon as Partial<CalcdexPokemon>)?.evs, { spread: 'ev', format }),

    showPresetSpreads: (pokemon as Partial<CalcdexPokemon>)?.showPresetSpreads || false,

    // update (2022/11/14): defaultShowGenetics setting is now deprecated in favor of lockGeneticsVisibility,
    // so this should be its new default, false (was previously true)
    showGenetics: (pokemon as Partial<CalcdexPokemon>)?.showGenetics || false,

    // update (2023/05/15): typically only used for Protosynthesis & Quark Drive
    // (populated in syncPokemon() & used in createSmogonPokemon())
    boostedStat: (pokemon as Partial<CalcdexPokemon>)?.boostedStat || null,
    dirtyBoostedStat: (pokemon as Partial<CalcdexPokemon>)?.boostedStat || null,

    boosts: PokemonBoostNames.reduce((table, stat) => {
      const boosts = (pokemon as Partial<Showdown.Pokemon>)?.boosts;

      // note: purposefully allowing SPC boosts in non-legacy, but will apply the SPC's stage to **both** SPA & SPD!
      const raw = (stat === 'spa' || stat === 'spd') && typeof boosts?.spc === 'number'
        ? boosts.spc
        : (boosts?.[stat] ?? 0);

      table[stat] = clamp(-6, raw, 6);

      return table;
    }, {} as Showdown.StatsTableNoHp),

    dirtyBoosts: PokemonBoostNames.reduce((table, stat) => {
      table[stat] = (pokemon as Partial<CalcdexPokemon>)?.dirtyBoosts?.[stat] ?? null;

      if (typeof table[stat] === 'number') {
        table[stat] = clamp(-6, table[stat] || 0, 6);
      }

      return table;
    }, {} as Showdown.StatsTableNoHp),

    autoBoostMap: { ...(pokemon as Partial<CalcdexPokemon>)?.autoBoostMap },
    transformedBaseStats: (pokemon as Partial<CalcdexPokemon>)?.transformedBaseStats || null,
    serverStats: (pokemon as Partial<CalcdexPokemon>)?.serverStats || null,
    dirtyBaseStats: PokemonStatNames.reduce((table, stat) => {
      table[stat] = (pokemon as Partial<CalcdexPokemon>)?.dirtyBaseStats?.[stat] ?? null;

      return table;
    }, {} as Showdown.StatsTable),

    status: (
      !!(pokemon as Partial<Showdown.Pokemon>)?.hp
        && (pokemon as Partial<Showdown.Pokemon>)?.status
    ) || null,
    dirtyStatus: (pokemon as Partial<CalcdexPokemon>)?.dirtyStatus || null,
    turnstatuses: (pokemon as Partial<Showdown.Pokemon>)?.turnstatuses,

    chainMove: (pokemon as Partial<CalcdexPokemon>)?.chainMove || null,
    chainCounter: (pokemon as Partial<CalcdexPokemon>)?.chainCounter || 0,

    sleepCounter: (pokemon as Partial<CalcdexPokemon>)?.sleepCounter
      || (pokemon as Partial<Showdown.Pokemon>)?.statusData?.sleepTurns
      || 0,

    toxicCounter: (pokemon as Partial<CalcdexPokemon>)?.toxicCounter
      || (pokemon as Partial<Showdown.Pokemon>)?.statusData?.toxicTurns
      || 0,

    hitCounter: (pokemon as Partial<CalcdexPokemon>)?.hitCounter
      || (pokemon as Partial<Showdown.Pokemon>)?.timesAttacked
      || 0,

    faintCounter: (pokemon as Partial<CalcdexPokemon>)?.faintCounter || 0,
    dirtyFaintCounter: (pokemon as Partial<CalcdexPokemon>)?.dirtyFaintCounter || null,

    useZ: (!legacy && (pokemon as Partial<CalcdexPokemon>)?.useZ) || false,
    useMax: (!legacy && (pokemon as Partial<CalcdexPokemon>)?.useMax) || false,

    terastallized: !legacy
      && typeof (pokemon as Partial<CalcdexPokemon>)?.terastallized === 'boolean'
      && (pokemon as Partial<CalcdexPokemon>).terastallized,

    criticalHit: (pokemon as Partial<CalcdexPokemon>)?.criticalHit || false,

    lastMove: (pokemon as Partial<CalcdexPokemon>)?.lastMove || null,
    moves: [...((pokemon as Partial<CalcdexPokemon>)?.moves || [])],
    serverMoves: (pokemon as Partial<CalcdexPokemon>)?.serverMoves || [],
    transformedMoves: (pokemon as Partial<CalcdexPokemon>)?.transformedMoves || [],
    altMoves: (pokemon as Partial<CalcdexPokemon>)?.altMoves || [],
    stellarMoveMap: { ...(pokemon as Partial<CalcdexPokemon>)?.stellarMoveMap },
    moveOverrides: { ...(pokemon as Partial<CalcdexPokemon>)?.moveOverrides },
    showMoveOverrides: (pokemon as Partial<CalcdexPokemon>)?.showMoveOverrides || false,

    // returns moveTrack and revealedMoves (guaranteed to be empty arrays, at the very least)
    ...sanitizeMoveTrack(pokemon, format),

    presetId: (pokemon as Partial<CalcdexPokemon>)?.presetId || null,
    presetSource: (pokemon as Partial<CalcdexPokemon>)?.presetSource || null,
    presets: (pokemon as Partial<CalcdexPokemon>)?.presets || [],
    autoPreset: (pokemon as Partial<CalcdexPokemon>)?.autoPreset || true,

    // only deep-copy non-object volatiles
    // (particularly Ditto's 'transform' volatile, which references an existing Pokemon object as its value)
    volatiles: sanitizeVolatiles(pokemon),
  };

  // fill in additional info if the Dex global is available (should be)
  // gen is important here; e.g., Crustle, who has 95 base ATK in Gen 5, but 105 in Gen 8
  const species = dex.species.get(sanitizedPokemon.speciesForme);

  // don't really care if species is falsy here
  sanitizedPokemon.baseStats = { ...species?.baseStats };
  sanitizedPokemon.dmaxable = !species?.cannotDynamax;

  // grab the base species forme to obtain its other formes
  // (since sanitizedPokemon.speciesForme could be one of those other formes)
  const baseSpeciesForme = species?.baseSpecies;
  const baseSpecies = baseSpeciesForme ? dex.species.get(baseSpeciesForme) : null;

  // grab the baseStats of the transformed Pokemon, if applicable
  const transformedSpecies = sanitizedPokemon.transformedForme
    ? dex.species.get(sanitizedPokemon.transformedForme)
    : null;

  const transformedBaseForme = transformedSpecies?.baseSpecies;
  const transformedBaseSpecies = transformedBaseForme ? dex.species.get(transformedBaseForme) : null;

  // check if this Pokemon can Dynamax
  sanitizedPokemon.dmaxable = !species.cannotDynamax;

  // attempt to populate all other formes based on the base forme
  // (or determined base forme from the current other forme)
  sanitizedPokemon.altFormes = transformedBaseSpecies?.otherFormes?.length && (
    transformedBaseSpecies.otherFormes.includes(sanitizedPokemon.transformedForme)
      || transformedBaseForme === sanitizedPokemon.transformedForme
  )
    ? [
      transformedBaseForme,
      ...transformedBaseSpecies.otherFormes,
    ]
    : baseSpecies?.otherFormes?.length && (
      baseSpecies.otherFormes.includes(sanitizedPokemon.speciesForme)
        || baseSpeciesForme === sanitizedPokemon.speciesForme
    )
      ? [
        baseSpeciesForme,
        ...baseSpecies.otherFormes,
      ]
      : [];

  // if this Pokemon can G-max, add the appropriate formes
  if (sanitizedPokemon.dmaxable && species.canGigantamax) {
    sanitizedPokemon.altFormes = sanitizedPokemon.altFormes.length
      // reason for the flatMap is to achieve:
      // ['Urshifu', 'Urshifu-Rapid-Strike']
      // -> ['Urshifu', 'Urshifu-Gmax', 'Urshifu-Rapid-Strike', 'Urshifu-Rapid-Strike-Gmax']
      ? sanitizedPokemon.altFormes.flatMap((forme) => {
        const output: string[] = [forme];

        // don't do another lookup if the current forme is what we've already looked up
        const currentSpecies = forme === species.name
          ? species
          : dex.species.get(forme);

        if (currentSpecies?.canGigantamax) {
          output.push(`${currentSpecies.name}-Gmax`);
        }

        return output;
      })
      : [
        sanitizedPokemon.speciesForme,
        `${sanitizedPokemon.speciesForme}-Gmax`,
      ];
  }

  // update (2023/12/29): if we have any altFormes[], verify that they exist in the gen so that Slowbro-Mega or
  // Slowbro-Galar don't show up in gen 1 or something... LOL imagine
  if (sanitizedPokemon.altFormes.length) {
    sanitizedPokemon.altFormes = sanitizedPokemon.altFormes
      .filter((altForme) => {
        const dexAltForme = dex.species.get(altForme);

        return !dexAltForme?.gen
          || !gen
          || gen >= dexAltForme.gen;
      });
  }

  if (nonEmptyObject(transformedSpecies?.baseStats)) {
    sanitizedPokemon.transformedBaseStats = { ...transformedSpecies.baseStats };

    // Transform ability doesn't copy the base HP stat
    // (uses the original Pokemon's base HP stat)
    if ('hp' in sanitizedPokemon.transformedBaseStats) {
      delete (sanitizedPokemon.transformedBaseStats as Showdown.StatsTable).hp;
    }
  }

  // only update the types if the dex returned types
  // (checking against typeChanged since if true, should've been already updated above)
  const speciesTypes = (transformedSpecies || species)?.types;

  if (!typeChanged && speciesTypes?.length) {
    sanitizedPokemon.types = [...speciesTypes];
  }

  // clear the dirtyTypes if it matches the current types
  // (since we're using diffArrays(), the order of the elements doesn't matter)
  if (sanitizedPokemon.dirtyTypes.length && similarArrays(sanitizedPokemon.types, sanitizedPokemon.dirtyTypes)) {
    sanitizedPokemon.dirtyTypes = [];
  }

  // if no teraType in gen 9, default to the Pokemon's first type
  if (gen > 8 && !sanitizedPokemon.teraType && !sanitizedPokemon.dirtyTeraType && sanitizedPokemon.types[0]) {
    [sanitizedPokemon.dirtyTeraType] = sanitizedPokemon.types;
  }

  // only update the abilities if the dex returned abilities (of the original, non-transformed Pokemon)
  sanitizedPokemon.abilities = [
    ...(Object.values(species?.abilities || {}) as AbilityName[]),
  ].filter((a) => !!a && formatId(a) !== 'noability');

  // if transformed, update the legal abilities of the transformed Pokemon
  sanitizedPokemon.transformedAbilities = [
    ...(Object.values(transformedSpecies?.abilities || {}) as AbilityName[]),
  ].filter((a) => !!a && formatId(a) !== 'noability');

  // check if we should auto-set the ability
  const abilitiesSource = sanitizedPokemon.transformedAbilities.length
    ? sanitizedPokemon.transformedAbilities
    : [...flattenAlts(sanitizedPokemon.altAbilities), ...sanitizedPokemon.abilities];

  const updateDirtyAbility = (
    (!sanitizedPokemon.ability || !!sanitizedPokemon.transformedForme)
      && (!sanitizedPokemon.dirtyAbility || !abilitiesSource.includes(sanitizedPokemon.dirtyAbility))
  );

  if (updateDirtyAbility) {
    [sanitizedPokemon.dirtyAbility] = abilitiesSource;
  }

  // determine the toggle state of the toggleable ability, if applicable
  sanitizedPokemon.abilityToggled = detectToggledAbility(sanitizedPokemon);

  if (!sanitizedPokemon?.calcdexId) {
    sanitizedPokemon.calcdexId = calcPokemonCalcdexId(sanitizedPokemon);
  }

  return sanitizedPokemon;
};

/* eslint-enable @typescript-eslint/indent */
