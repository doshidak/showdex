import { type GenerationNum } from '@smogon/calc';
import { getDexForFormat } from '@showdex/utils/dex';

/* eslint-disable @typescript-eslint/indent */

/**
 * Reconstructs the `details` property from the provided `pokemon`.
 *
 * * Doesn't consider the original `pokemon.details` value at all to avoid any inconsistencies.
 *   - While `Showdown.Pokemon` & `Showdown.ServerPokemon` have wild inconsistencies in terms of how their `ident`,
 *     `details` & `searchid` properties are populated, the **base** forme will always be available under `speciesForme`.
 *   - At a later point, the `speciesForme` of a `Showdown.Pokemon` may update to reflect its current forme, while its
 *     corresponding `Showdown.ServerPokemon` will still be its base forme.
 *   - To mitigate this inconsistency, it may be worth passing the optional `format` argument, explained further below.
 * * For maximum compatibility with Showdown's `details` formatting, the `level` is omitted when `100`.
 * * Providing the optional `format` argument will replace the `speciesForme` with its base forme (e.g., `baseSpecies`)
 *   from a dex lookup, if available.
 *   - This is useful for reliably handling the *Species Clause* rule, which only allows one Pokemon of the same species,
 *     regardless of its forme (e.g., *Urshifu* & *Urshifu-Rapid-Strike* count as the same species, i.e., *Urshifu*).
 * * Primarily used to scope out potentially duplicate Pokemon in `syncBattle()`, particularly in regards to *Illusion*.
 *   - Personally wouldn't use this as a de facto method for consistently IDing Pokemon across its different object
 *     representations (i.e., `Showdown.Pokemon`, `Showdown.ServerPokemon` & `CalcdexPokemon`).
 *   - Should only be used to initially identify a Pokemon across the aforementioned objects in order to assign a
 *     consistent `calcdexId` to them.
 * * If the reconstruction fails for whatever reason, `null` will be returned.
 *
 * @example
 * ```ts
 * detectPokemonDetails({
 *   ident: 'p1: Pikachu',
 *   name: 'Pikachu',
 *   details: 'Zoroark, L69, M',
 *   searchid: 'p1: Pikachu|Zoroark, L69, M',
 *   level: 69,
 *   gender: 'M',
 *   ...
 * } as Showdown.ServerPokemon);
 *
 * 'Zoroark, L69, M'
 * ```
 * @since 1.1.7
 */
export const detectPokemonDetails = <
  TPokemon extends Partial<Showdown.PokemonDetails>,
>(
  pokemon: TPokemon,
  config?: {
    format?: string | GenerationNum;
    normalizeForme?: boolean;
    wildcardForme?: boolean;
    ignoreLevel?: boolean;
    ignoreGender?: boolean;
    ignoreShiny?: boolean;
    delimiter?: string;
  },
): string => {
  if (!pokemon?.speciesForme) {
    return null;
  }

  const {
    format,
    normalizeForme,
    wildcardForme,
    ignoreLevel,
    ignoreGender,
    ignoreShiny = true,
    delimiter = ', ',
  } = config || {};

  const output: string[] = [
    pokemon.speciesForme,
    (!ignoreLevel && !!pokemon.level && pokemon.level < 100) && `L${pokemon.level}`,
    (!ignoreGender && pokemon.gender !== 'N') && pokemon.gender,
    (!ignoreShiny && pokemon.shiny) && 'shiny',
  ].filter(Boolean);

  if (normalizeForme && format) {
    const dex = getDexForFormat(format);

    const dexSpecies = dex.species.get(output[0]);
    const baseForme = dexSpecies?.baseSpecies;

    if (baseForme && output[0] !== baseForme) {
      output[0] = wildcardForme && dexSpecies?.forme
        ? output[0].replace(dexSpecies?.forme, '*')
        : baseForme;
    }
  }

  return output.join(delimiter);
};

/* eslint-enable @typescript-eslint/indent */
