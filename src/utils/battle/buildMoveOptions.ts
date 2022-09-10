import { LegalLockedFormats } from '@showdex/consts';
// import { env } from '@showdex/utils/core';
import type { MoveName } from '@pkmn/data';
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
 * Builds the value for the `options` prop of the move `Dropdown` component in `PokeMoves`.
 *
 * * As of v1.0.1, we're opting to use the global `Dex` object as opposed to the `dex` from `@pkmn/dex`
 *   since we still get back information even if we're not in the correct gen (especially in National Dex formats).
 *
 * @since 0.1.3
 */
export const buildMoveOptions = (
  // dex: Generation,
  format: string,
  pokemon: DeepPartial<CalcdexPokemon>,
): PokemonMoveOption[] => {
  // const gen = dex?.num || <GenerationNum> env.int('calcdex-default-gen');
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
    // useUltimateMoves,
    useZ,
    useMax,
  } = pokemon;

  // keep track of what moves we have so far to avoid duplicate options
  const filterMoves: MoveName[] = [];

  // since we pass useZ into createSmogonMove(), we need to keep the original move name as the value
  // (but we'll show the corresponding Z move to the user, if any)
  // (also, non-Z moves may appear under the Z-PWR group in the dropdown, but oh well)
  if (useZ && moves?.length) {
    options.push({
      label: 'Z-PWR',
      options: moves.map((name) => ({
        label: getZMove(name, item) || name,
        value: name,
      })),
    });

    filterMoves.push(...moves);
  }

  // note: entirely possible to have both useZ and useMax enabled, such as in nationaldexag
  if (useMax && moves?.length) {
    options.push({
      label: 'Max',
      options: moves.map((name) => ({
        label: getMaxMove(name, ability, speciesForme) || name,
        value: name,
      })),
    });

    if (!useZ) {
      filterMoves.push(...moves);
    }
  }

  if (serverSourced && serverMoves?.length) {
    const filteredServerMoves = serverMoves.filter((n) => !!n && !filterMoves.includes(n));

    options.push({
      label: 'Current',
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
    const poolMoves = altMoves
      .filter((n) => !!n && !filterMoves.includes(n))
      .sort();

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
      .filter((n) => !!n && !filterMoves.includes(n))
      .sort();

    options.push({
      label: 'Learnset',
      options: learnsetMoves.map((name) => ({
        label: name,
        value: name,
      })),
    });

    filterMoves.push(...learnsetMoves);
  }

  // show all possible moves if format is not provided, is not legal-locked, or
  // no learnset is available (probably because the Pokemon doesn't exist in the `dex`'s gen)
  const parsedFormat = format?.replace(/^gen\d+/i, '');

  if (!parsedFormat || !LegalLockedFormats.includes(parsedFormat) || !moveState?.learnset?.length) {
    const otherMoves = Object.keys(BattleMovedex || {})
      .map((moveid) => <MoveName> Dex.moves.get(moveid)?.name)
      .filter((n) => !!n && !filterMoves.includes(n))
      .sort();

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
