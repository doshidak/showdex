import { type GenerationNum } from '@smogon/calc';
import { PokemonNatureBoosts, PokemonStatNames } from '@showdex/consts/dex';
import { type CalcdexPokemonPresetSpread } from '@showdex/interfaces/calc';
import { nonEmptyObject } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import { getDefaultSpreadValue } from '@showdex/utils/dex';

// const l = logger('@showdex/utils/hydro/dehydrateSpread()');

/**
 * Dehydrates the provided `spread` with each stat separated by the `config.delimiter`.
 *
 * * Output format is in the typical order of Pokemon stats, i.e., `<HP>/<Atk>/<Def>/<SpA>/<SpD>/<Spe>`.
 * * Nature information is embedded by `+` & `-` symbols after the EV value for the positive & negative stats, respectively.
 *   - Assume a neutral nature like *Hardy* when these symbols are absent during rehydration.
 *   - This is typically the case for presets in Randoms & legacy gens.
 * * IVs will be shown in parentheses (e.g., `'(30)0'` indicating 30 IVs & 0 EVs) if not the default value.
 *   - Unless `config.omitIvs` is enabled, of course.
 * * Note that in order to determine the default spread value (via `getDefaultSpreadValue()` wow), the `config.format`
 *   argument is required!
 *
 * @example
 * ```ts
 * dehydrateSpread({
 *   nature: 'Adamant',
 *   ivs: { hp: 31, ..., spa: 0, ..., spe: 31 },
 *   evs: { hp: 252, atk: 252, spe: 4 },
 *   usage: 0.2408,
 * } as CalcdexPokemonPresetSpread, {
 *   format: 'gen9ou',
 * });
 *
 * '252/252+/0/(0)0-/0/4'
 * ```
 * @since 1.1.8
 */
export const dehydrateSpread = (
  spread: CalcdexPokemonPresetSpread,
  config: {
    format: string | GenerationNum;
    delimiter?: string;
    altDelimiter?: string;
    omitAlt?: boolean;
    omitNature?: boolean;
    omitIvs?: boolean;
  },
): string => {
  const {
    nature,
    ivs,
    evs,
    usage,
  } = spread || {};

  const {
    format,
    delimiter = '/',
    altDelimiter = '@',
    omitAlt,
    omitNature,
    omitIvs,
  } = config || {};

  if (!nature && !nonEmptyObject(ivs) && !nonEmptyObject(evs)) {
    return null;
  }

  const defaultIv = getDefaultSpreadValue('iv', format);
  const defaultEv = getDefaultSpreadValue('ev', format);

  const [pos, neg] = PokemonNatureBoosts[nature] || [];

  const parts = PokemonStatNames.map((stat) => {
    let iv = ivs?.[stat] ?? defaultIv;
    let ev = evs?.[stat] ?? defaultEv;

    if (Number.isNaN(iv)) {
      iv = defaultIv;
    }

    if (Number.isNaN(ev)) {
      ev = defaultEv;
    }

    let part = String(ev);

    if (!omitIvs && iv !== defaultIv) {
      part = `(${iv})${part}`;
    }

    if (stat === 'hp' || omitNature || !pos || !neg) {
      return part;
    }

    if (stat === pos) {
      part += '+';
    }

    if (stat === neg) {
      part += '-';
    }

    return part;
  });

  const output = parts.join(delimiter);

  // l.debug(
  //   'dehydrating spread', spread,
  //   '\n', 'config', config,
  //   '\n', 'defaultIv', defaultIv, 'defaultEv', defaultEv,
  //   '\n', 'output', `${output}${usage ? `${altDelimiter}${usage}` : ''}`,
  // );

  if (!omitAlt && usage) {
    return `${output}${altDelimiter}${usage}`;
  }

  return output;
};
