import { type CalcdexPokemon } from '@showdex/redux/store';

export const detectPokemonIdent = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<Showdown.ServerPokemon> | DeepPartial<CalcdexPokemon> = {},
): string => [
  // 'p1', 'p2', etc.
  ('side' in pokemon ? pokemon.side?.sideid : null)
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
