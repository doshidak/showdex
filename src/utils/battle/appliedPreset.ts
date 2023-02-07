import type { GenerationNum } from '@smogon/calc';
import type { CalcdexPokemon, CalcdexPokemonPreset } from '@showdex/redux/store';
import { detectGenFromFormat } from './detectGenFromFormat';
import { detectLegacyGen } from './detectLegacyGen';

/**
 * Determines if the `pokemon` has the provided `preset` applied.
 *
 * * This is determined by comparing the following:
 *   - Ability (if not legacy),
 *   - Nature (if not legacy),
 *   - Item (for gens 2+),
 *   - Moves (in no particular order as long as all of the `preset`'s moves exist in `pokemon.moves`),
 *   - IVs (DVs if legacy; SPD is ignored for gen 1 since SPA is used for SPC),
 *   - EVs (if not legacy),
 * * Note that the `calcdexId` of the `preset` & `pokemon.presetId` and `teraTypes` are not taken into consideration.
 * * Dirty properties are considered for the `pokemon` only, but no alternative properties in `preset` are considered.
 *
 * @example
 * ```ts
 * appliedPreset('gen9ou', <CalcdexPokemon> {
 *   ...,
 *   speciesForme: 'Garganacl',
 *   teraType: 'Water', // not considered btw
 *   ability: null,
 *   dirtyAbility: 'Purifying Salt',
 *   item: null,
 *   itemEffect: null,
 *   dirtyItem: null,
 *   prevItem: 'Leftovers',
 *   prevItemEffect: 'knocked off',
 *   nature: 'Impish',
 *   moves: ['Protect', 'Recover', 'Stealth Rock', 'Salt Cure'],
 *   ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
 *   evs: { hp: 252, atk: 0, def: 228, spa: 0, spd: 28, spe: 0 },
 *   ...,
 * }, <CalcdexPokemonPreset> {
 *   ...,
 *   name: 'Stealth Rock',
 *   gen: 9,
 *   format: 'gen9ou',
 *   teraTypes: ['Water'], // not considered btw
 *   ability: 'Purifying Salt',
 *   item: 'Leftovers',
 *   nature: 'Impish',
 *   moves: ['Salt Cure', 'Recover', 'Protect', 'Stealth Rock'],
 *   evs: { hp: 252, def: 228, spd: 28 },
 *   ...,
 * });
 *
 * true
 * ```
 * @since 1.1.3
 */
export const appliedPreset = (
  format: GenerationNum | string,
  pokemon: CalcdexPokemon,
  preset: Partial<CalcdexPokemonPreset>,
): boolean => {
  if (!format || !pokemon?.speciesForme || !preset?.source) {
    return false;
  }

  const gen = typeof format === 'string'
    ? detectGenFromFormat(format)
    : format;

  if (!gen) {
    return false;
  }

  const legacy = detectLegacyGen(format);
  const defaultIv = legacy ? 30 : 31;

  const {
    nature: pokemonNature,
    moves: pokemonMoves,
    ivs: pokemonIvs,
    evs: pokemonEvs,
  } = pokemon;

  const {
    ability: presetAbility,
    item: presetItem,
    nature: presetNature,
    moves: presetMoves,
    ivs: presetIvs,
    evs: presetEvs,
  } = preset;

  const pokemonAbility = pokemon.dirtyAbility || pokemon.ability;
  const pokemonItem = pokemon.dirtyItem ?? (pokemon.prevItem || pokemon.item);

  return (legacy || (!!pokemonNature && !!presetNature && pokemonNature === presetNature))
    && (legacy || (!!pokemonAbility && !!presetAbility && pokemonAbility === presetAbility))
    && (gen < 2 || (!!pokemonItem && !!presetItem && pokemonItem === presetItem))
    && (!!pokemonMoves?.length && !!presetMoves?.length && pokemonMoves.every((move) => presetMoves.includes(move)))
    && Object.entries(pokemonIvs || {})
      .every(([stat, value]) => (legacy && ['hp', 'spd'].includes(stat)) || (presetIvs?.[stat] ?? defaultIv) === value)
    && (legacy || Object.entries(pokemonEvs || {}).every(([stat, value]) => (presetEvs?.[stat] || 0) === value));
};
