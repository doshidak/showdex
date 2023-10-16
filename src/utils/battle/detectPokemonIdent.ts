// import { type CalcdexPokemon } from '@showdex/redux/store';

/* eslint-disable @typescript-eslint/indent */

/**
 * Attempts to detect the player key from the `ident` of the passed-in `pokemon`.
 *
 * * Note that unlike `detectPokemonDetails()`, this does **not** consistently return the same `ident`.
 *   - Rather, it just goes down a list of possible properties in `pokemon` that can be used to reconstruct the ident.
 *
 * @since 0.1.0
 */
export const detectPokemonIdent = <
  TPokemon extends Partial<Showdown.PokemonDetails>,
>(
  pokemon: TPokemon,
): string => [
  // 'p1', 'p2', etc.
  ('side' in pokemon ? (pokemon as Partial<Showdown.Pokemon>).side?.sideid : null)
    || pokemon?.searchid?.split?.(':')[0]
    || pokemon?.ident?.split?.(':')[0],

  // speciesForme
  pokemon?.speciesForme
    || pokemon?.details?.split?.(', ')?.[0]
    || pokemon?.searchid?.split?.('|')[1]
    || pokemon?.ident?.split?.(': ')[1]
    || pokemon?.name, // terrible cause it could be a nickname, but if we're here, oh well
].filter(Boolean).join(': ') // e.g., 'p1: Pikachu'
  || pokemon?.ident
  || pokemon?.searchid?.split?.('|')[0];

/* eslint-enable @typescript-eslint/indent */
