import type { CalcdexPokemon } from '@showdex/redux/store';

export const detectPokemonIdent = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<Showdown.ServerPokemon> | DeepPartial<CalcdexPokemon> = {},
): string => [
  ('side' in pokemon ? pokemon.side?.sideid : null)
    || pokemon?.ident?.split?.(':')[0],
  ('volatiles' in pokemon && pokemon.volatiles?.formechange?.[1])
    || pokemon?.speciesForme
    || pokemon?.ident?.split?.(': ')[1]
    || pokemon?.details?.split?.(', ')?.[0]
    || pokemon?.name,
].filter(Boolean).join(': ')
  || pokemon?.ident
  || pokemon?.searchid?.split?.('|')[0];
