// import type { CalcdexPokemon } from './CalcdexReducer';
import { sanitizeSpeciesForme } from './sanitizeSpeciesForme';

export const detectPokemonIdent = (
  pokemon: Partial<Showdown.Pokemon>,
): string => sanitizeSpeciesForme(
  [
    pokemon?.ident?.split?.(':')[0]
      || pokemon?.side?.sideid,
    pokemon?.volatiles?.formechange?.[1]
      || pokemon?.speciesForme
      || pokemon?.ident?.split?.(': ')[1]
      || pokemon?.details?.split?.(', ')?.[0]
      || pokemon?.name,
  ].filter(Boolean).join(': ')
    || pokemon?.ident
    || pokemon?.searchid?.split?.('|')[0],
);
