import type { CalcdexPokemon } from '@showdex/redux/store';

export const detectSpeciesForme = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<CalcdexPokemon> = {},
): string => pokemon?.speciesForme // 'Zygarde-Complete' -- ideally we'd use this one
  || pokemon?.details?.split?.(', ')[0] // 'Zygarde, L100, N' -> 'Zygarde' (normally just 'Zygarde' tho)
  || pokemon?.searchid?.split?.('|')[1] // 'p1: Zygarde|Zygarde-Complete' -> 'Zygarde-Complete'
  || pokemon?.ident?.split?.(': ')[1]; // 'p1: Zygarde' -> 'Zygarde'
