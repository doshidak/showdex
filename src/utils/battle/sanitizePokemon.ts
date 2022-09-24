import { PokemonNatures } from '@showdex/consts';
import { formatId } from '@showdex/utils/app';
import { calcPokemonCalcdexId } from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
import type {
  AbilityName,
  GenerationNum,
  ItemName,
  MoveName,
} from '@pkmn/data';
import type { CalcdexPokemon } from '@showdex/redux/store';
import { detectLegacyGen } from './detectLegacyGen';
import { detectPokemonIdent } from './detectPokemonIdent';
import { detectSpeciesForme } from './detectSpeciesForme';
import { detectToggledAbility } from './detectToggledAbility';
import { toggleableAbility } from './toggleableAbility';

/**
 * Pokemon `volatiles` require special love and attention before they get Redux'd.
 *
 * * Ditto
 *   - ...and Mew, I guess
 * * hnnnnnnnnnnnnnnnnnnnnnnnng
 * * Separated from `sanitizePokemon()` cause I'm probably using it elsewhere.
 *
 * @since 0.1.3
 */
export const sanitizePokemonVolatiles = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<CalcdexPokemon> = {},
): CalcdexPokemon['volatiles'] => Object.entries(pokemon?.volatiles || {}).reduce((volatiles, [id, volatile]) => {
  const [
    ,
    value,
    ...rest
  ] = volatile || [];

  // we're gunna replace the Pokemon object w/ its ident if it's a transform volatile
  const transformed = formatId(id) === 'transform'
    && typeof (<Showdown.Pokemon> <unknown> value)?.ident === 'string';

  if (transformed || !value || ['string', 'number'].includes(typeof value)) {
    volatiles[id] = transformed ? [
      id, // value[0] is also the id
      (<Showdown.Pokemon> <unknown> value).speciesForme,
      ...rest,
    ] : volatile;
  }

  return volatiles;
}, {});

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
  gen: GenerationNum = env.int<GenerationNum>('calcdex-default-gen'),
): CalcdexPokemon => {
  const legacy = detectLegacyGen(gen);

  const typeChanged = !!pokemon.volatiles?.typechange?.[1];
  const transformed = !!pokemon.volatiles?.transform?.[1];

  const sanitizedPokemon: CalcdexPokemon = {
    calcdexId: ('calcdexId' in pokemon && pokemon.calcdexId) || null,
    // calcdexNonce: ('calcdexNonce' in pokemon && pokemon.calcdexNonce) || null,

    slot: pokemon?.slot ?? null, // could be 0, so don't use logical OR here
    ident: detectPokemonIdent(pokemon),
    searchid: pokemon?.searchid,

    speciesForme: detectSpeciesForme(pokemon),
    altFormes: ('altFormes' in pokemon && !!pokemon.altFormes?.length && pokemon.altFormes) || [],
    transformedForme: transformed
      ? typeof pokemon.volatiles.transform[1] === 'object'
        ? (<Showdown.Pokemon> <unknown> pokemon.volatiles.transform[1])?.speciesForme || null
        : pokemon.volatiles.transform[1] || null
      : null,

    name: pokemon?.name,
    details: pokemon?.details,
    level: pokemon?.level || 0,
    gender: pokemon?.gender,
    shiny: pokemon?.shiny,

    types: typeChanged
      ? <Showdown.TypeName[]> pokemon.volatiles.typechange[1].split('/') || []
      : ('types' in pokemon && pokemon.types) || [],

    ability: (!legacy && <AbilityName> pokemon?.ability) || null,
    dirtyAbility: ('dirtyAbility' in pokemon && pokemon.dirtyAbility) || null,
    // abilityToggled: 'abilityToggled' in pokemon ? pokemon.abilityToggled : detectToggledAbility(pokemon),
    baseAbility: <AbilityName> pokemon?.baseAbility?.replace(/no\s?ability/i, ''),
    abilities: (!legacy && 'abilities' in pokemon && pokemon.abilities) || [],
    altAbilities: (!legacy && 'altAbilities' in pokemon && pokemon.altAbilities) || [],
    transformedAbilities: (!legacy && 'transformedAbilities' in pokemon && pokemon.transformedAbilities) || [],

    item: gen > 1
      ? <ItemName> pokemon?.item?.replace('(exists)', '')
      : null,

    dirtyItem: ('dirtyItem' in pokemon && pokemon.dirtyItem) || null,
    altItems: (gen > 1 && 'altItems' in pokemon && pokemon.altItems) || [],
    itemEffect: pokemon?.itemEffect,
    prevItem: <ItemName> pokemon?.prevItem,
    prevItemEffect: pokemon?.prevItemEffect,

    nature: !legacy
      ? ('nature' in pokemon && pokemon.nature) || PokemonNatures[0]
      : null,

    ivs: {
      hp: ('ivs' in pokemon && pokemon.ivs?.hp) ?? 31,
      atk: ('ivs' in pokemon && pokemon.ivs?.atk) ?? 31,
      def: ('ivs' in pokemon && pokemon.ivs?.def) ?? 31,
      spa: ('ivs' in pokemon && pokemon.ivs?.spa) ?? 31,
      spd: ('ivs' in pokemon && pokemon.ivs?.spd) ?? 31,
      spe: ('ivs' in pokemon && pokemon.ivs?.spe) ?? 31,
    },

    evs: !legacy ? {
      hp: ('evs' in pokemon && pokemon.evs?.hp) ?? 0,
      atk: ('evs' in pokemon && pokemon.evs?.atk) ?? 0,
      def: ('evs' in pokemon && pokemon.evs?.def) ?? 0,
      spa: ('evs' in pokemon && pokemon.evs?.spa) ?? 0,
      spd: ('evs' in pokemon && pokemon.evs?.spd) ?? 0,
      spe: ('evs' in pokemon && pokemon.evs?.spe) ?? 0,
    } : {},

    boosts: {
      atk: typeof pokemon?.boosts?.atk === 'number' ? pokemon.boosts.atk : 0,
      def: typeof pokemon?.boosts?.def === 'number' ? pokemon.boosts.def : 0,
      spa: 'spc' in (pokemon?.boosts || {}) && typeof (<Showdown.Pokemon> pokemon).boosts.spc === 'number'
        ? (<Showdown.Pokemon> pokemon).boosts.spc
        : typeof pokemon?.boosts?.spa === 'number' ? pokemon.boosts.spa : 0,
      spd: typeof pokemon?.boosts?.spd === 'number' ? pokemon.boosts.spd : 0,
      spe: typeof pokemon?.boosts?.spe === 'number' ? pokemon.boosts.spe : 0,
    },

    dirtyBoosts: {
      atk: ('dirtyBoosts' in pokemon && pokemon.dirtyBoosts?.atk) || undefined,
      def: ('dirtyBoosts' in pokemon && pokemon.dirtyBoosts?.def) || undefined,
      spa: ('dirtyBoosts' in pokemon && pokemon.dirtyBoosts?.spa) || undefined,
      spd: ('dirtyBoosts' in pokemon && pokemon.dirtyBoosts?.spd) || undefined,
      spe: ('dirtyBoosts' in pokemon && pokemon.dirtyBoosts?.spe) || undefined,
    },

    status: pokemon?.status,
    statusData: {
      sleepTurns: pokemon?.statusData?.sleepTurns || 0,
      toxicTurns: pokemon?.statusData?.toxicTurns || 0,
    },

    // only deep-copy non-object volatiles
    // (particularly Ditto's 'transform' volatile, which references an existing Pokemon object as its value)
    volatiles: sanitizePokemonVolatiles(pokemon),

    turnstatuses: pokemon?.turnstatuses,
    toxicCounter: pokemon?.statusData?.toxicTurns,

    hp: pokemon?.hp || 0,
    maxhp: pokemon?.maxhp || 1,
    fainted: pokemon?.fainted ?? !pokemon?.hp,

    moves: <MoveName[]> pokemon?.moves || [],
    serverMoves: ('serverMoves' in pokemon && pokemon.serverMoves) || [],
    transformedMoves: ('transformedMoves' in pokemon && pokemon.transformedMoves) || [],
    altMoves: ('altMoves' in pokemon && pokemon.altMoves) || [],
    useZ: (!legacy && 'useZ' in pokemon && pokemon.useZ) || false,
    useMax: (!legacy && 'useMax' in pokemon && pokemon.useMax) || false,
    lastMove: pokemon?.lastMove,

    moveTrack: Array.isArray(pokemon?.moveTrack)
      // since pokemon.moveTrack is an array of arrays,
      // we don't want to reference the original inner array elements
      ? <CalcdexPokemon['moveTrack']> structuredClone(pokemon.moveTrack)
      : [],

    moveState: {
      revealed: ('moveState' in pokemon && pokemon.moveState?.revealed) || [],
      learnset: ('moveState' in pokemon && pokemon.moveState?.learnset) || [],
      // other: ('moveState' in pokemon && pokemon.moveState?.other) || [],
    },

    criticalHit: ('criticalHit' in pokemon && pokemon.criticalHit) || false,

    preset: ('preset' in pokemon && pokemon.preset) || null,
    presets: ('presets' in pokemon && pokemon.presets) || [],
    autoPreset: 'autoPreset' in pokemon ? pokemon.autoPreset : true,
  };

  // abilityToggleable is mainly used for UI, hence why there are two of
  // what seems to be essentially the same thing
  // (but note that abilityToggled stores the current toggle state)
  sanitizedPokemon.abilityToggleable = toggleableAbility(sanitizedPokemon);
  sanitizedPokemon.abilityToggled = detectToggledAbility(sanitizedPokemon);

  // fill in additional info if the Dex global is available (should be)
  if (typeof Dex !== 'undefined') {
    // gen is important here; e.g., Crustle, who has 95 base ATK in Gen 5, but 105 in Gen 8
    const species = Dex.forGen(gen).species.get(sanitizedPokemon.speciesForme);

    // don't really care if species is falsy here
    sanitizedPokemon.baseStats = { ...species?.baseStats };

    // grab the baseStats of the transformed Pokemon, if applicable
    const transformedSpecies = sanitizedPokemon.transformedForme
      ? Dex.forGen(gen).species.get(sanitizedPokemon.transformedForme)
      : null;

    // only set the altFormes if we're currently looking at the baseForme
    sanitizedPokemon.altFormes = transformedSpecies?.baseSpecies
      && transformedSpecies.baseSpecies === sanitizedPokemon.transformedForme
      && transformedSpecies.otherFormes?.length
      ? [
        transformedSpecies.baseSpecies,
        ...(<string[]> transformedSpecies.otherFormes), // dunno why otherFormes is type any[]
      ]
      : species?.baseSpecies
        && species.baseSpecies === sanitizedPokemon.speciesForme
        && species.otherFormes?.length
        ? [
          species.baseSpecies,
          ...(<string[]> species.otherFormes),
        ]
        : [];

    if (transformedSpecies?.baseStats) {
      sanitizedPokemon.transformedBaseStats = { ...transformedSpecies.baseStats };

      // Transform ability doesn't copy the base HP stat
      // (uses the original Pokemon's base HP stat)
      if ('hp' in sanitizedPokemon.transformedBaseStats) {
        delete (<Showdown.StatsTable> sanitizedPokemon.transformedBaseStats).hp;
      }
    }

    // only update the types if the dex returned types
    // (checking against typeChanged since if true, should've been already updated above)
    if (!typeChanged && (transformedSpecies || species)?.types?.length) {
      sanitizedPokemon.types = [
        ...(<Showdown.TypeName[]> (transformedSpecies || species).types),
      ];
    }

    // only update the abilities if the dex returned abilities (of the original, non-transformed Pokemon)
    // (using Set makes sure there aren't any duplicate abilities in the array)
    sanitizedPokemon.abilities = Array.from(new Set([
      ...(sanitizedPokemon.abilities || []),
      ...(<AbilityName[]> Object.values(species?.abilities || {})),
    ].filter(Boolean)));

    // if transformed, update the legal abilities of the transformed Pokemon
    sanitizedPokemon.transformedAbilities = [
      ...(<AbilityName[]> Object.values(transformedSpecies?.abilities || {})),
    ].filter(Boolean);

    // check if we should auto-set the ability
    const abilitiesSource = sanitizedPokemon.transformedAbilities.length
      ? sanitizedPokemon.transformedAbilities
      : sanitizedPokemon.abilities;

    if (!sanitizedPokemon.ability || (sanitizedPokemon.dirtyAbility && !abilitiesSource.includes(sanitizedPokemon.dirtyAbility))) {
      [sanitizedPokemon.dirtyAbility] = abilitiesSource;
    }
  }

  if (!sanitizedPokemon?.calcdexId) {
    sanitizedPokemon.calcdexId = calcPokemonCalcdexId(sanitizedPokemon);
  }

  // sanitizedPokemon.calcdexNonce = calcPokemonCalcdexNonce(sanitizedPokemon);

  return sanitizedPokemon;
};
