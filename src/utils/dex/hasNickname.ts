import { type CalcdexPokemon } from '@showdex/redux/store';
import { getDexForFormat } from './getDexForFormat';

/**
 * Whether the passed-in `pokemon` has a nickname.
 *
 * @since 1.0.3
 */
export const hasNickname = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<Showdown.ServerPokemon> | DeepPartial<CalcdexPokemon> = {},
): boolean => {
  if (!pokemon?.speciesForme || !pokemon.name) {
    return false;
  }

  const dex = getDexForFormat();
  const dexSpecies = dex?.species.get(pokemon.speciesForme);

  return !pokemon.name.endsWith('-*')
    && !pokemon.speciesForme.endsWith('-*')
    && pokemon.name !== dexSpecies?.baseSpecies
    && pokemon.name !== pokemon.speciesForme;
};
