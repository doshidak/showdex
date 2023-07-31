import { type AbilityName, type GenerationNum } from '@smogon/calc';
import { type PkmnSmogonPreset } from '@showdex/redux/services';
import { type CalcdexPokemonPreset } from '@showdex/redux/store';
import { calcPresetCalcdexId } from '@showdex/utils/calc';
import { nonEmptyObject } from '@showdex/utils/core';
import { detectLegacyGen, getDexForFormat, getGenlessFormat } from '@showdex/utils/dex';

/**
 * Internal transformer for converting a single `PkmnSmogonPreset` from the pkmn Sets API into a `CalcdexPokemonPreset`.
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
  preset: PkmnSmogonPreset,
): CalcdexPokemonPreset => {
  if (!gen || !format || !speciesForme || !nonEmptyObject(preset)) {
    return null;
  }

  const legacy = detectLegacyGen(gen);
  const defaultIv = legacy ? 30 : 31;
  const defaultEv = legacy ? 252 : 0;

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
    source: 'smogon',
    name: presetName || 'Smogon Set', // e.g., 'Defensive Pivot'
    gen,
    format: getGenlessFormat(format), // just in case; e.g., 'ou'

    speciesForme, // do not sanitize
    ability: Array.isArray(ability) ? ability[0] : ability,
    altAbilities: Array.isArray(ability) ? ability : [ability].filter(Boolean),

    nature: Array.isArray(nature) ? nature[0] : nature,

    item: Array.isArray(item) ? item[0] : item,
    altItems: Array.isArray(item) ? item : [item].filter(Boolean),

    moves: moves?.map((move) => (Array.isArray(move) ? move[0] : move)) ?? [],
    altMoves: flatMoves.filter((m, i) => !flatMoves.includes(m, i + 1)), // remove dupe moves

    ivs: {
      hp: typeof ivs?.hp === 'number' ? ivs.hp : defaultIv,
      atk: typeof ivs?.atk === 'number' ? ivs.atk : defaultIv,
      def: typeof ivs?.def === 'number' ? ivs.def : defaultIv,
      spa: typeof ivs?.spa === 'number' ? ivs.spa : defaultIv,
      spd: typeof ivs?.spd === 'number' ? ivs.spd : defaultIv,
      spe: typeof ivs?.spe === 'number' ? ivs.spe : defaultIv,
    },

    evs: {
      hp: typeof evs?.hp === 'number' ? evs.hp : defaultEv,
      atk: typeof evs?.atk === 'number' ? evs.atk : defaultEv,
      def: typeof evs?.def === 'number' ? evs.def : defaultEv,
      spa: typeof evs?.spa === 'number' ? evs.spa : defaultEv,
      spd: typeof evs?.spd === 'number' ? evs.spd : defaultEv,
      spe: typeof evs?.spe === 'number' ? evs.spe : defaultEv,
    },
  };

  // if the response omitted the `ability`, then grab it from the dex
  if (!output.ability) {
    const dex = getDexForFormat(format);
    const species = dex?.species.get(speciesForme);

    if (species?.exists && species.abilities?.[0]) {
      output.ability = species.abilities[0] as AbilityName;
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
