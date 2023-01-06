import { calcPokemonSpreadStats } from '@showdex/utils/calc';
import type { CalcdexPokemon, CalcdexPokemonPreset } from '@showdex/redux/store';
import { detectGenFromFormat } from './detectGenFromFormat';
import { detectLegacyGen } from './detectLegacyGen';
// import { flattenAlts } from './flattenAlts';
import { getPresetFormes } from './getPresetFormes';

/**
 * From the provided Teambuilder `presets`, finds and verifies a matching `CalcdexPokemonPreset`
 * for the passed-in server-sourced `pokemon`.
 *
 * * If the `pokemon` does not have any populated `serverStats`, `null` will be returned.
 *   - As previously mentioned, this utility is only meant for use with server-sourced Pokemon!
 *   - As a fallback, if a matching preset couldn't be found, revert to using `guessServerSpread()`.
 * * Verification entails calculating the Pokemon's `baseStats` with the spread applied from the potentially
 *   matching Teambuilder preset, then making sure the resulting values match with those of `spreadStats`.
 *   - Since this utility is meant to be used when a Pokemon is first loaded into the Calcdex,
 *     user-modifiable properties, namely `dirtyBaseStats`, are not taken into account.
 * * For the sake of performance, this utility does not grab Teambuilder presets for you.
 *   - You'll need to use `getTeambuilderPresets()` and pass its return value into this utility
 *     as the `presets` argument.
 *
 * @since 1.1.2
 */
export const guessTeambuilderPreset = (
  presets: CalcdexPokemonPreset[],
  pokemon: CalcdexPokemon,
  format: string,
): CalcdexPokemonPreset => {
  if (!presets?.length || !pokemon?.speciesForme || !format) {
    return null;
  }

  const {
    speciesForme,
    transformedForme,
    // teraType,
    serverStats,
    serverMoves,
    transformedMoves,
  } = pokemon;

  if (!Object.keys(serverStats || {}).length) {
    return null;
  }

  const moves = transformedForme ? transformedMoves : serverMoves;

  if (!moves?.length) {
    return null;
  }

  const formes = getPresetFormes(transformedForme || speciesForme);
  const pokemonPresets = presets.filter((p) => formes.includes(p?.speciesForme));

  if (!pokemonPresets.length) {
    return null;
  }

  const gen = detectGenFromFormat(format);
  const legacy = detectLegacyGen(gen);

  // attempt to find matching candidates based on the Pokemon's ability, item, and moves
  // update (2023/01/04): not checking teraType since we'll go off of what the server reports anyway
  const candidates = pokemonPresets.filter((p) => (
    (legacy || p.ability === pokemon.ability) // abilities aren't supported in legacy gens
      && (gen === 1 || p.item === pokemon.item) // items are supported in gens 2+
      && p.moves.every((m) => moves.includes(m))
      // && (!p.teraTypes?.length || !teraType || flattenAlts(p.teraTypes).includes(teraType))
  ));

  if (!candidates.length) {
    return null;
  }

  for (const candidate of candidates) {
    const {
      nature,
      ivs,
      evs,
    } = candidate;

    const calculatedStats = calcPokemonSpreadStats(format, {
      ...pokemon,
      dirtyBaseStats: null, // make sure we're not using this when calcing
      nature,
      ivs,
      evs,
    });

    const foundMatch = (!serverStats.hp || serverStats.hp === calculatedStats.hp)
      && serverStats.atk === calculatedStats.atk
      && serverStats.def === calculatedStats.def
      && serverStats.spa === calculatedStats.spa
      && serverStats.spd === calculatedStats.spd
      && serverStats.spe === calculatedStats.spe;

    if (foundMatch) {
      return candidate;
    }
  }

  return null;
};
