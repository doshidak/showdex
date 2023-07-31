import {
  type AbilityName,
  type GenerationNum,
  type ItemName,
  type MoveName,
} from '@smogon/calc';
import { PokemonNatures } from '@showdex/consts/dex';
import { type CalcdexPokemon } from '@showdex/redux/store';
import { calcPokemonCalcdexId } from '@showdex/utils/calc';
import { env, similarArrays } from '@showdex/utils/core';
import {
  detectGenFromFormat,
  detectLegacyGen,
  getDexForFormat,
  toggleableAbility,
} from '@showdex/utils/dex';
import { flattenAlts } from '@showdex/utils/presets/flattenAlts'; /** @todo reorganize me */
import { detectPlayerKeyFromPokemon } from './detectPlayerKey';
import { detectPokemonIdent } from './detectPokemonIdent';
import { detectSpeciesForme } from './detectSpeciesForme';
import { detectToggledAbility } from './detectToggledAbility';
import { sanitizeMoveTrack } from './sanitizeMoveTrack';
import { sanitizeVolatiles } from './sanitizeVolatiles';

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
 * @since 0.1.0
 */
export const sanitizePokemon = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<CalcdexPokemon> = {},
  format?: GenerationNum | string,
  showAllFormes?: boolean,
): CalcdexPokemon => {
  const dex = getDexForFormat(format);

  const gen = typeof format === 'string'
    ? detectGenFromFormat(format, env.int<GenerationNum>('calcdex-default-gen'))
    : format;

  const legacy = detectLegacyGen(format);
  const defaultIv = legacy ? 30 : 31;

  // update: actually, changed my mind; better to have evs as an empty object
  // update (2023/07/24): TIL EVs do exist in legacy gens as "stats EXP", which goes up to 65535 &
  // eventually gets square rooted when you're level 100, which equates about 252 LOL
  // (also in Randoms, some of the Pokemon randomly have 0 EVs, so we need to record that now oof)
  // ... no regrets
  const defaultEv = legacy ? 252 : 0;

  const typeChanged = !!pokemon.volatiles?.typechange?.[1];
  const transformed = !!pokemon.volatiles?.transform?.[1];

  const sanitizedPokemon: CalcdexPokemon = {
    calcdexId: ('calcdexId' in pokemon && pokemon.calcdexId) || null,
    serverSourced: ('serverSourced' in pokemon && pokemon.serverSourced) || false,
    playerKey: ('playerKey' in pokemon && pokemon.playerKey)
      || detectPlayerKeyFromPokemon(pokemon)
      || null,

    slot: pokemon?.slot ?? null, // could be 0, so don't use logical OR here
    ident: detectPokemonIdent(pokemon),
    name: pokemon?.name,
    details: pokemon?.details || null,
    searchid: pokemon?.searchid || null,

    speciesForme: detectSpeciesForme(pokemon)?.replace('-*', ''),
    altFormes: ('altFormes' in pokemon && !!pokemon.altFormes?.length && pokemon.altFormes) || [],
    transformedForme: transformed
      ? typeof pokemon.volatiles.transform[1] === 'object'
        ? (pokemon.volatiles.transform[1] as unknown as Showdown.Pokemon)?.speciesForme || null
        : pokemon.volatiles.transform[1] || null
      : null,

    level: pokemon?.level || 0,
    gender: pokemon?.gender || 'N',

    shiny: pokemon?.shiny || false,
    dmaxable: ('dmaxable' in pokemon && pokemon.dmaxable) || false,
    gmaxable: ('gmaxable' in pokemon && pokemon.gmaxable) || false,

    types: typeChanged
      ? pokemon.volatiles.typechange[1].split('/') as Showdown.TypeName[] || []
      : ('types' in pokemon && pokemon.types) || [],
    dirtyTypes: ('dirtyTypes' in pokemon && pokemon.dirtyTypes) || [],
    teraType: ('teraType' in pokemon && pokemon.teraType)
      || (typeof pokemon?.terastallized === 'string' && pokemon.terastallized)
      || null,
    revealedTeraType: ('revealedTeraType' in pokemon && pokemon.revealedTeraType)
      || (typeof pokemon.terastallized === 'string' && pokemon.terastallized)
      || null,
    altTeraTypes: ('altTeraTypes' in pokemon && !!pokemon.altTeraTypes?.length && pokemon.altTeraTypes) || [],

    hp: pokemon?.hp || 0,
    dirtyHp: 'dirtyHp' in pokemon ? (pokemon.dirtyHp ?? null) : null, // note: 0 = fainted, so null is when the user resets back to `hp`
    maxhp: pokemon?.maxhp || 1,
    fainted: pokemon?.fainted ?? !pokemon?.hp,

    ability: (!legacy && pokemon?.ability as AbilityName) || null,
    dirtyAbility: ('dirtyAbility' in pokemon && pokemon.dirtyAbility) || null,
    // abilityToggled: 'abilityToggled' in pokemon ? pokemon.abilityToggled : detectToggledAbility(pokemon),
    baseAbility: pokemon?.baseAbility?.replace(/no\s?ability/i, '') as AbilityName,
    abilities: (!legacy && 'abilities' in pokemon && pokemon.abilities) || [],
    altAbilities: (!legacy && 'altAbilities' in pokemon && pokemon.altAbilities) || [],
    transformedAbilities: (!legacy && 'transformedAbilities' in pokemon && pokemon.transformedAbilities) || [],

    item: gen > 1 && pokemon?.item && pokemon.item !== '(exists)'
      ? dex.items.get(pokemon.item)?.name as ItemName
      : null,

    dirtyItem: ('dirtyItem' in pokemon && pokemon.dirtyItem) || null,
    altItems: (gen > 1 && 'altItems' in pokemon && pokemon.altItems) || [],
    itemEffect: pokemon?.itemEffect || null,
    prevItem: pokemon?.prevItem as ItemName || null,
    prevItemEffect: pokemon?.prevItemEffect || null,

    nature: !legacy
      ? ('nature' in pokemon && pokemon.nature) || PokemonNatures[0]
      : null,

    ivs: {
      hp: 'ivs' in pokemon && typeof pokemon.ivs?.hp === 'number' ? pokemon.ivs.hp : defaultIv,
      atk: 'ivs' in pokemon && typeof pokemon.ivs?.atk === 'number' ? pokemon.ivs.atk : defaultIv,
      def: 'ivs' in pokemon && typeof pokemon.ivs?.def === 'number' ? pokemon.ivs.def : defaultIv,
      spa: 'ivs' in pokemon && typeof pokemon.ivs?.spa === 'number' ? pokemon.ivs.spa : defaultIv,
      spd: 'ivs' in pokemon && typeof pokemon.ivs?.spd === 'number' ? pokemon.ivs.spd : defaultIv,
      spe: 'ivs' in pokemon && typeof pokemon.ivs?.spe === 'number' ? pokemon.ivs.spe : defaultIv,
    },

    evs: {
      hp: 'evs' in pokemon && typeof pokemon.evs?.hp === 'number' ? pokemon.evs.hp : defaultEv,
      atk: 'evs' in pokemon && typeof pokemon.evs?.atk === 'number' ? pokemon.evs.atk : defaultEv,
      def: 'evs' in pokemon && typeof pokemon.evs?.def === 'number' ? pokemon.evs.def : defaultEv,
      spa: 'evs' in pokemon && typeof pokemon.evs?.spa === 'number' ? pokemon.evs.spa : defaultEv,
      spd: 'evs' in pokemon && typeof pokemon.evs?.spd === 'number' ? pokemon.evs.spd : defaultEv,
      spe: 'evs' in pokemon && typeof pokemon.evs?.spe === 'number' ? pokemon.evs.spe : defaultEv,
    },

    // update (2022/11/14): defaultShowGenetics setting is now deprecated in favor of lockGeneticsVisibility,
    // so this should be its new default, false (was previously true)
    showGenetics: ('showGenetics' in pokemon && pokemon.showGenetics) || false,

    // update (2023/05/15): typically only used for Protosynthesis & Quark Drive
    // (populated in syncPokemon() & used in createSmogonPokemon())
    boostedStat: ('boostedStat' in pokemon && pokemon.boostedStat) || null,

    boosts: {
      atk: typeof pokemon?.boosts?.atk === 'number' ? pokemon.boosts.atk : 0,
      def: typeof pokemon?.boosts?.def === 'number' ? pokemon.boosts.def : 0,
      spa: 'spc' in (pokemon?.boosts || {}) && typeof (pokemon as Showdown.Pokemon).boosts.spc === 'number'
        ? (pokemon as Showdown.Pokemon).boosts.spc
        : typeof pokemon?.boosts?.spa === 'number' ? pokemon.boosts.spa : 0,
      spd: typeof pokemon?.boosts?.spd === 'number' ? pokemon.boosts.spd : 0,
      spe: typeof pokemon?.boosts?.spe === 'number' ? pokemon.boosts.spe : 0,
    },

    // note to self: you can't clean this up in O(1) unless you wanna (a) use a loop, (b) use a ternary where you check
    // 'dirtyBoosts' in pokemon first, but realize TypeScript is angy, so you end up doing (a) or (c) devise some advanced mainframe
    // algorithms that does everything in O(1), including earning my Ph.D, when all you need to do was copy a tiny object & fill it
    // with null's if its value is falsy :o -- wait you mean the `in` operator is O(n) ??? frick
    dirtyBoosts: {
      atk: ('dirtyBoosts' in pokemon && pokemon.dirtyBoosts?.atk) || null,
      def: ('dirtyBoosts' in pokemon && pokemon.dirtyBoosts?.def) || null,
      spa: ('dirtyBoosts' in pokemon && pokemon.dirtyBoosts?.spa) || null,
      spd: ('dirtyBoosts' in pokemon && pokemon.dirtyBoosts?.spd) || null,
      spe: ('dirtyBoosts' in pokemon && pokemon.dirtyBoosts?.spe) || null,
    },

    dirtyBaseStats: {
      atk: ('dirtyBaseStats' in pokemon && pokemon.dirtyBaseStats?.atk) || null,
      def: ('dirtyBaseStats' in pokemon && pokemon.dirtyBaseStats?.def) || null,
      spa: ('dirtyBaseStats' in pokemon && pokemon.dirtyBaseStats?.spa) || null,
      spd: ('dirtyBaseStats' in pokemon && pokemon.dirtyBaseStats?.spd) || null,
      spe: ('dirtyBaseStats' in pokemon && pokemon.dirtyBaseStats?.spe) || null,
    },

    status: pokemon?.fainted || !pokemon?.hp ? null : pokemon?.status,
    dirtyStatus: ('dirtyStatus' in pokemon && pokemon.dirtyStatus) || null,
    turnstatuses: pokemon?.turnstatuses,

    chainMove: ('chainMove' in pokemon && pokemon.chainMove) || null,
    chainCounter: ('chainCounter' in pokemon && pokemon.chainCounter) || 0,
    sleepCounter: ('sleepCounter' in pokemon && pokemon.sleepCounter) || pokemon?.statusData?.sleepTurns || 0,
    toxicCounter: ('toxicCounter' in pokemon && pokemon.toxicCounter) || pokemon?.statusData?.toxicTurns || 0,
    hitCounter: ('hitCounter' in pokemon && pokemon.hitCounter) || pokemon?.timesAttacked || 0,
    faintCounter: ('faintCounter' in pokemon && pokemon.faintCounter) || 0,
    dirtyFaintCounter: ('dirtyFaintCounter' in pokemon && pokemon.dirtyFaintCounter) || null,

    useZ: (!legacy && 'useZ' in pokemon && pokemon.useZ) || false,
    useMax: (!legacy && 'useMax' in pokemon && pokemon.useMax) || false,
    terastallized: (!legacy && typeof pokemon?.terastallized === 'boolean' && pokemon.terastallized) || false,
    criticalHit: ('criticalHit' in pokemon && pokemon.criticalHit) || false,

    lastMove: pokemon?.lastMove as MoveName || null,
    moves: pokemon?.moves as MoveName[] || [],
    serverMoves: ('serverMoves' in pokemon && pokemon.serverMoves) || [],
    transformedMoves: ('transformedMoves' in pokemon && pokemon.transformedMoves) || [],
    altMoves: ('altMoves' in pokemon && pokemon.altMoves) || [],
    moveOverrides: { ...('moveOverrides' in pokemon && pokemon.moveOverrides) },
    showMoveOverrides: ('showMoveOverrides' in pokemon && pokemon.showMoveOverrides) || false,

    // returns moveTrack and revealedMoves (guaranteed to be empty arrays, at the very least)
    ...sanitizeMoveTrack(pokemon, format),

    presetId: ('presetId' in pokemon && pokemon.presetId) || null,
    presets: ('presets' in pokemon && pokemon.presets) || [],
    autoPreset: 'autoPreset' in pokemon ? pokemon.autoPreset : true,

    // only deep-copy non-object volatiles
    // (particularly Ditto's 'transform' volatile, which references an existing Pokemon object as its value)
    volatiles: sanitizeVolatiles(pokemon),
  };

  // fill in additional info if the Dex global is available (should be)
  // gen is important here; e.g., Crustle, who has 95 base ATK in Gen 5, but 105 in Gen 8
  /** @todo remove `dex` check here since we already check for `Dex` in `main` */
  if (dex) {
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

    const transformedBaseSpeciesForme = transformedSpecies?.baseSpecies;
    const transformedBaseSpecies = transformedBaseSpeciesForme
      ? dex.species.get(transformedBaseSpeciesForme)
      : null;

    // check if this Pokemon can Dynamax
    sanitizedPokemon.dmaxable = !species.cannotDynamax;

    // attempt to populate all other formes based on the base forme
    // (or determined base forme from the curren other forme if showAllFormes is true)
    sanitizedPokemon.altFormes = transformedBaseSpecies?.otherFormes?.length
        && (
          (showAllFormes && transformedBaseSpecies.otherFormes.includes(sanitizedPokemon.transformedForme))
            || transformedBaseSpeciesForme === sanitizedPokemon.transformedForme
        )
      ? [
        transformedBaseSpeciesForme,
        ...(transformedBaseSpecies.otherFormes as string[]),
      ]
      : baseSpecies?.otherFormes?.length
          && (
            (showAllFormes && baseSpecies.otherFormes.includes(sanitizedPokemon.speciesForme))
              || baseSpeciesForme === sanitizedPokemon.speciesForme
          )
        ? [
          baseSpeciesForme,
          ...(baseSpecies.otherFormes as string[]),
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

    if (transformedSpecies?.baseStats) {
      sanitizedPokemon.transformedBaseStats = { ...transformedSpecies.baseStats };

      // Transform ability doesn't copy the base HP stat
      // (uses the original Pokemon's base HP stat)
      if ('hp' in sanitizedPokemon.transformedBaseStats) {
        delete (sanitizedPokemon.transformedBaseStats as Showdown.StatsTable).hp;
      }
    }

    // only update the types if the dex returned types
    // (checking against typeChanged since if true, should've been already updated above)
    const speciesTypes = (transformedSpecies || species)?.types as Showdown.TypeName[];

    if (!typeChanged && speciesTypes?.length) {
      sanitizedPokemon.types = [...speciesTypes];
    }

    // clear the dirtyTypes if it matches the current types
    // (since we're using diffArrays(), the order of the elements doesn't matter)
    if (sanitizedPokemon.dirtyTypes.length && similarArrays(sanitizedPokemon.types, sanitizedPokemon.dirtyTypes)) {
      sanitizedPokemon.dirtyTypes = [];
    }

    // if no teraType in gen 9, default to the Pokemon's first type
    if (gen > 8 && !sanitizedPokemon.teraType && sanitizedPokemon.types[0]) {
      [sanitizedPokemon.teraType] = sanitizedPokemon.types;
    }

    // only update the abilities if the dex returned abilities (of the original, non-transformed Pokemon)
    // (using Set makes sure there aren't any duplicate abilities in the array)
    // update (2023/02/02): don't want to persist the legal abilities from the prior forme, which can be
    // problematic for Mega Pokemon who have one legal ability compared to their non-Mega'd counterparts
    sanitizedPokemon.abilities = Array.from(new Set([
      // ...(sanitizedPokemon.abilities || []),
      ...(Object.values(species?.abilities || {}) as AbilityName[]),
    ].filter(Boolean)));

    // if transformed, update the legal abilities of the transformed Pokemon
    sanitizedPokemon.transformedAbilities = [
      ...(Object.values(transformedSpecies?.abilities || {}) as AbilityName[]),
    ].filter(Boolean);

    // check if we should auto-set the ability
    const abilitiesSource = sanitizedPokemon.transformedAbilities.length
      ? sanitizedPokemon.transformedAbilities
      : [...flattenAlts(sanitizedPokemon.altAbilities), ...sanitizedPokemon.abilities];

    if (!sanitizedPokemon.ability || (sanitizedPokemon.dirtyAbility && !abilitiesSource.includes(sanitizedPokemon.dirtyAbility))) {
      [sanitizedPokemon.dirtyAbility] = abilitiesSource;
    }
  }

  // abilityToggleable is mainly used for UI, hence why there are two of
  // what seems to be essentially the same thing
  // (but note that abilityToggled stores the current toggle state)
  sanitizedPokemon.abilityToggleable = toggleableAbility(sanitizedPokemon);
  sanitizedPokemon.abilityToggled = detectToggledAbility(sanitizedPokemon);

  if (!sanitizedPokemon?.calcdexId) {
    sanitizedPokemon.calcdexId = calcPokemonCalcdexId(sanitizedPokemon);
  }

  // sanitizedPokemon.calcdexNonce = calcPokemonCalcdexNonce(sanitizedPokemon);

  return sanitizedPokemon;
};
