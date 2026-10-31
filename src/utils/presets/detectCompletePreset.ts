import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { detectLegacyGen } from '@showdex/utils/dex';

/**
 * Checks if the provided `preset` has the minimum required fields to be considered usable
 * (i.e., cacheable & matchable), regardless of whether its EVs are set.
 *
 * * EVs are intentionally NOT checked here: Randoms data sources (e.g., `gen9championsrandombattle`)
 *   often omit `evs` entirely, yet the preset is still fully usable for displaying moves, items,
 *   abilities & tera types. Damage calcs simply fall back to the default spreads when EVs are absent.
 * * The following properties are **always** required for any valid `CalcdexPokemonPreset`:
 *   - `calcdexId`
 *   - `source`
 *   - `speciesForme`
 *   - `moves[]` (or `altMoves[]`) with at least 1 entry
 *
 * @since 1.2.1
 */
export const detectValidPreset = (
  preset: CalcdexPokemonPreset,
): boolean => !!preset?.calcdexId
  && !!preset.source
  && !!preset.speciesForme
  && !!(preset.altMoves?.length || preset.moves?.length);

/**
 * Checks if the provided `preset` is complete.
 *
 * * This is determined whether the `moves[]` (at least 1) & if in a non-legacy gen, `evs` are set.
 *   - For the EVs (in non-legacy gens) to be considered "set," one of the values must be a non-negative, non-zero number.
 *   - IVs aren't checked since it's conventional to omit them if they're all 31 (or 30 [i.e., 15 DVs] in legacy gens).
 *   - Most preset builders will default to a `'Hardy'` nature, so we won't bother checking that.
 *   - You could, in theory, check the preset's `format` & only allow a neutral nature in, say, Randoms, but sometimes
 *     you come across those oddball Pokemon in the standard metagame like OU, so this wouldn't be a foolproof solution.
 * * *Partial* presets would include *Open Team Sheets* (OTS), which omit the exact spreads, i.e., nature, EVs & IVs.
 * * Additionally, the following properties are **always** required for any valid `CalcdexPokemonPreset`:
 *   - `calcdexId`
 *   - `source`
 *   - `speciesForme`
 *
 * @example
 * ```ts
 * detectCompletePreset({
 *   // NIL_UUID for sake of example
 *   calcdexId: '00000000-0000-0000-0000-000000000000',
 *   id: '00000000-0000-0000-0000-000000000000',
 *   name: 'Team Sheet',
 *   source: 'sheet',
 *   playerName: 'showdex_testee',
 *   gen: 9,
 *   format: 'vgc2023',
 *   speciesForme: 'Tyranitar',
 *   level: 50,
 *   gender: 'M',
 *   item: 'Assault Vest',
 *   ability: 'Sand Stream',
 *   teraTypes: ['Fairy'],
 *   nature: 'Hardy', // note: this is the default, neutral nature since OTS's don't provide them!
 *   moves: [
 *     'Knock Off',
 *     'Rock Slide',
 *     'Low Kick',
 *     'Tera Blast',
 *   ],
 *   ivs: { atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
 *   evs: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
 * } as CalcdexPokemonPreset);
 *
 * false
 * ```
 * @since 1.1.7
 */
export const detectCompletePreset = (
  preset: CalcdexPokemonPreset,
): boolean => {
  if (!detectValidPreset(preset)) {
    return false;
  }

  const {
    gen,
    // ivs,
    evs,
  } = preset;

  return detectLegacyGen(gen)
    || Object.values(evs || {}).some((ev) => (ev || 0) > 0);
};
