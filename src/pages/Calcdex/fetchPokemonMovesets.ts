import { logger } from '@showdex/utils/debug';
import type { Generation as PkmnGeneration } from '@pkmn/data';
import type { CalcdexPokemon } from './CalcdexReducer';
import { detectPokemonIdent } from './detectPokemonIdent';
import { detectSpeciesForme } from './detectSpeciesForme';

const l = logger('@showdex/pages/Calcdex/fetchPokemonMovesets');

export const fetchPokemonMovesets = async (
  dex: PkmnGeneration,
  pokemon: Partial<CalcdexPokemon>,
  format?: string,
): Promise<Partial<CalcdexPokemon>> => {
  const ident = detectPokemonIdent(pokemon);
  const speciesForme = detectSpeciesForme(pokemon);

  const newPokemon: Partial<CalcdexPokemon> = {
    moveState: {
      revealed: pokemon.moveTrack?.map?.((m) => m?.[0]).filter(Boolean)
        ?? pokemon.moveState?.revealed
        ?? [],
      learnset: pokemon.moveState?.learnset ?? [],
      other: pokemon.moveState?.other ?? [],
    },
  };

  if (!speciesForme) {
    l.warn(
      'fetchPokemonMovesets() <- detectSpeciesForme()',
      '\n', 'failed to detect speciesForme from Pokemon with ident', ident,
      '\n', 'speciesForme', speciesForme,
      '\n', 'pokemon', pokemon,
    );

    return newPokemon;
  }

  if (typeof dex?.learnsets?.learnable === 'function') {
    // l.debug(
    //   'fetchPokemonMovesets() -> await dex.learnsets.learnable()',
    //   '\n', 'speciesForme', speciesForme,
    //   '\n', 'ident', ident,
    // );

    const learnset = await dex.learnsets.learnable(speciesForme);

    newPokemon.moveState.learnset = Object.keys(learnset || {})
      .map((moveid) => dex.moves.get(moveid)?.name)
      .filter((name) => !!name && !newPokemon.moveState.revealed.includes(name))
      .sort();

    // l.debug(
    //   'fetchPokemonMovesets() <- await dex.learnsets.learnable()',
    //   '\n', 'speciesForme', speciesForme,
    //   '\n', 'learnset for', ident, 'set to', newPokemon.moveState.learnset,
    // );
  }

  // build `other`, only if we have no `learnsets` or the `format` has something to do with hacks
  if (!newPokemon.moveState.learnset.length || (format && /anythinggoes|hackmons/i.test(format))) {
    // l.debug(
    //   'fetchPokemonPresets() -> BattleMovedex',
    //   '\n', 'building other movesets list from client BattleMovedex object',
    //   '\n', 'moveState', newPokemon.moveState,
    //   '\n', 'format', format,
    //   '\n', 'ident', ident,
    // );

    newPokemon.moveState.other = Object.keys(BattleMovedex)
      .map((moveid) => dex.moves.get(moveid)?.name)
      .filter((name) => !!name && !newPokemon.moveState.revealed.includes(name) && !newPokemon.moveState.learnset?.includes?.(name))
      .sort();

    // l.debug(
    //   'fetchPokemonMovesets() <- BattleMovedex',
    //   '\n', 'newPokemon.moveState.other', newPokemon.moveState.other,
    //   '\n', 'ident', ident,
    // );
  }

  // l.debug(
  //   'fetchPokemonMovesets() -> return newPokemon',
  //   '\n', 'newPokemon', newPokemon,
  // );

  return newPokemon;
};
