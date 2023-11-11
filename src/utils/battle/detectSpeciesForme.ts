/* eslint-disable @typescript-eslint/indent */

/**
 * Attempts to find the `speciesForme` of the provided `pokemon`.
 *
 * * This should always return a value for any valid `pokemon` object.
 *   - `speciesForme` is the only required property, so if this couldn't find it, oh boye o boyo...
 *   - (you're screwed lol)
 * * Also note that this may *potentially* return a nickname depending on where the "species forme" was sourced from,
 *   so make sure you double-check if the return value is valid!
 *
 * @since 0.1.0
 */
export const detectSpeciesForme = <
  TPokemon extends Partial<Showdown.PokemonDetails>,
>(
  pokemon: TPokemon,
): string => pokemon?.speciesForme // 'Zygarde-Complete' -- ideally we'd use this one
  || pokemon?.details?.split?.(', ')[0] // 'Zygarde, L100, N' -> 'Zygarde' (normally just 'Zygarde' tho)
  || pokemon?.searchid?.split?.('|')[1] // 'p1: Zygarde|Zygarde-Complete' -> 'Zygarde-Complete'
  || pokemon?.ident?.split?.(': ')[1]; // 'p1: Zygarde' -> 'Zygarde'

/* eslint-enable @typescript-eslint/indent */
