import { type AbilityName, type GenerationNum } from '@smogon/calc';
import { type PkmnApiSmogonPreset } from '@showdex/interfaces/api';
import { type CalcdexPokemonPreset, type CalcdexPokemonPresetSource, type CalcdexPokemonPresetSpread } from '@showdex/interfaces/calc';
import { calcPresetCalcdexId, populateStatsTable } from '@showdex/utils/calc';
import { nonEmptyObject } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import { getDexForFormat, getGenlessFormat } from '@showdex/utils/dex';

// const l = logger('@showdex/redux/transformers/transformPkmnSmogonPreset()');

/**
 * Internal transformer for converting a single `PkmnApiSmogonPreset` from the pkmn Sets API into a `CalcdexPokemonPreset`.
 *
 * * Primarily exported for use by `transformFormatPresetResponse()`.
 * * Returns `null` if transforming fails for whatever reason.
 * * Incompatible with the pkmn Randoms & Stats APIs.
 *   - For use with the Sets API only!
 * * Update (2023/07/23): TIL the pkmn API will omit a preset's `ability` if it's the same as the species' default ability.
 *   - Default ability is denoted by the `0` key in the `abilities` object returned by the `dex.species.get()` lookup.
 *   - Don't be fooled tho, it's not an array! It's an object with a `0` key (see the `Showdown.Species` type in `species.d.ts`).
 *   - Also, this seems to only apply to the Sets API & not the Randoms API!
 *
 * @since 1.1.6
 */
export const transformPkmnSmogonPreset = (
  gen: GenerationNum,
  format: string,
  speciesForme: string,
  presetName: string,
  preset: PkmnApiSmogonPreset,
  source: CalcdexPokemonPresetSource = 'smogon',
  formatIndex?: number,
): CalcdexPokemonPreset => {
  if (!gen || !format || !speciesForme || !nonEmptyObject(preset)) {
    return null;
  }

  const dex = getDexForFormat(gen);

  const {
    teraTypes: presetTeraTypes,
    teratypes: presetTeratypes,
    ability,
    nature,
    item,
    moves,
    ivs,
    evs,
  } = preset;

  const flatMoves = moves?.flatMap((move) => move) ?? [];

  const output: CalcdexPokemonPreset = {
    calcdexId: null, // we'll hash this after we build the object
    id: null, // will equal calcdexId, so the same applies as above
    source,
    name: presetName || 'Smogon Set', // e.g., 'Defensive Pivot'
    gen,
    format: getGenlessFormat(format), // just in case; e.g., 'ou'
    formatIndex,
    speciesForme, // do not sanitize
    ability: Array.isArray(ability) ? ability[0] : ability,
    altAbilities: Array.isArray(ability) ? ability : [ability].filter(Boolean),
    item: Array.isArray(item) ? item[0] : item,
    altItems: Array.isArray(item) ? item : [item].filter(Boolean),
    moves: moves?.map((move) => (Array.isArray(move) ? move[0] : move)) ?? [],
    altMoves: flatMoves.filter((m, i) => !flatMoves.includes(m, i + 1)), // remove dupe moves
  };

  const length = Math.max(
    1,
    Array.isArray(nature) ? nature.length : 0,
    Array.isArray(ivs) ? ivs.length : 0,
    Array.isArray(evs) ? evs.length : 0,
  );

  output.spreads = Array(length).fill(null).map((_, i) => ({
    nature: Array.isArray(nature) ? (nature[i] || nature[0]) : nature,

    ivs: populateStatsTable(
      Array.isArray(ivs) ? (ivs[i] || ivs[0]) : ivs,
      {
        spread: 'iv',
        format: gen,
      },
    ),

    evs: populateStatsTable(
      Array.isArray(evs) ? (evs[i] || evs[0]) : evs,
      {
        spread: 'ev',
        format: gen,
      },
    ),
  } as CalcdexPokemonPresetSpread));

  output.nature = output.spreads[0]?.nature;
  output.ivs = { ...output.spreads[0]?.ivs };
  output.evs = { ...output.spreads[0]?.evs };

  if (output.item) {
    // e.g., output.item = 'Charizardite X' -> megaForme = 'Charizard-Mega-X'
    const megaForme = dex.items.get(output.item)?.megaStone;

    if (megaForme && output.speciesForme !== megaForme) {
      output.speciesForme = megaForme;
    }
  }

  // if the response omitted the `ability`, then grab it from the dex
  if (!output.ability || output.speciesForme !== speciesForme) {
    const abilities = dex.species.get(output.speciesForme)?.abilities;

    // note: abilities is an object with keys such as '0', '1' & 'H' (hidden)
    if (abilities?.[0] && !Object.values(abilities).includes(output.ability)) {
      output.ability = abilities[0] as AbilityName;
      output.altAbilities.push(output.ability); // would be empty before this push()
    }
  }

  // determine the Tera types (first from teraTypes [if the API fixes the casing], then teratypes)
  // (note: this was straight up copied from transformFormatPresetResponse())
  const teraTypes = (!!presetTeraTypes?.length && typeof presetTeraTypes === 'string' && [presetTeraTypes])
    || (!!presetTeraTypes?.length && Array.isArray(presetTeraTypes) && presetTeraTypes)
    || (!!presetTeratypes?.length && typeof presetTeratypes === 'string' && [presetTeratypes])
    || (!!presetTeratypes?.length && Array.isArray(presetTeratypes) && presetTeratypes)
    || [];

  if (teraTypes.length) {
    output.teraTypes = [...teraTypes];
  }

  output.calcdexId = calcPresetCalcdexId(output);
  output.id = output.calcdexId; // used by RTK Query for tagging

  return output;
};
