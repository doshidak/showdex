import { env } from '@showdex/utils/core';
import type { Generation, GenerationNum, MoveName } from '@pkmn/data';
import type { CalcdexPokemon } from '@showdex/redux/store';
import { getMaxMove } from './getMaxMove';
import { getZMove } from './getZMove';

export interface PokemonMoveOption {
  label: string;
  options: {
    label: string;
    value: MoveName;
  }[];
}

/**
 * Builds the value for the `options` prop of the `Dropdown` component in `PokeMoves`.
 *
 * @since 0.1.3
 */
export const buildMoveOptions = (
  dex: Generation,
  pokemon: DeepPartial<CalcdexPokemon>,
): PokemonMoveOption[] => {
  const gen = dex?.num || <GenerationNum> env.int('calcdex-default-gen');
  const options: PokemonMoveOption[] = [];

  if (!pokemon?.speciesForme) {
    return options;
  }

  const ability = pokemon.dirtyAbility ?? pokemon.ability;
  const item = pokemon.dirtyItem ?? pokemon.item;

  const {
    serverSourced,
    speciesForme,
    transformedForme,
    moves,
    serverMoves,
    transformedMoves,
    altMoves,
    moveState,
    useUltimateMoves,
  } = pokemon;

  // keep track of what moves we have so far to avoid duplicate options
  const filterMoves: MoveName[] = [];

  if (useUltimateMoves && moves?.length) {
    options.push({
      label: gen === 7 ? 'Z' : 'Max',
      options: moves.map((name) => {
        const ultName = gen === 7
          ? getZMove(dex, name, item)
          : getMaxMove(dex, name, ability, speciesForme);

        return ultName ? {
          label: ultName,
          value: name,
        } : null;
      }).filter(Boolean),
    });

    filterMoves.push(...moves);
  }

  if (serverSourced && serverMoves?.length) {
    const filteredServerMoves = serverMoves.filter((n) => !!n && !filterMoves.includes(n));

    options.push({
      label: 'Actual',
      options: filteredServerMoves.map((name) => ({
        label: name,
        value: name,
      })),
    });

    filterMoves.push(...filteredServerMoves);
  }

  if (transformedForme && transformedMoves?.length) {
    const filteredTransformedMoves = transformedMoves.filter((n) => !!n && !filterMoves.includes(n));

    options.unshift({
      label: 'Transformed',
      options: filteredTransformedMoves.map((name) => ({
        label: name,
        value: name,
      })),
    });

    filterMoves.push(...filteredTransformedMoves);
  }

  if (moveState?.revealed?.length) {
    const revealedMoves = moveState.revealed
      .map((n) => <MoveName> n?.replace?.('*', ''))
      .filter((n) => !!n && !filterMoves.includes(n));

    options.push({
      label: 'Revealed',
      options: revealedMoves.map((name) => ({
        label: name,
        value: name,
      })),
    });

    filterMoves.push(...revealedMoves);
  }

  if (altMoves?.length) {
    const poolMoves = altMoves.filter((n) => !!n && !filterMoves.includes(n));

    options.push({
      label: 'Pool',
      options: poolMoves.map((name) => ({
        label: name,
        value: name,
      })),
    });

    filterMoves.push(...poolMoves);
  }

  if (moveState?.learnset?.length) {
    const learnsetMoves = (<MoveName[]> moveState.learnset)
      .filter((n) => !!n && !filterMoves.includes(n));

    options.push({
      label: 'Learnset',
      options: learnsetMoves.map((name) => ({
        label: name,
        value: name,
      })),
    });

    filterMoves.push(...learnsetMoves);
  }

  // appl

  // typically only available in almostanyability and hackmons formats
  if (moveState?.other?.length) {
    const otherMoves = (<MoveName[]> moveState.other)
      .filter((n) => !!n && !filterMoves.includes(n));

    options.push({
      label: 'Other',
      options: otherMoves.map((name) => ({
        label: name,
        value: name,
      })),
    });
  }

  return options;
};
