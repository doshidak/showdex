import { LegalLockedFormats } from '@showdex/consts';
import { formatId } from '@showdex/utils/app';
// import { env } from '@showdex/utils/core';
import type { MoveName } from '@pkmn/data';
import type { CalcdexPokemon } from '@showdex/redux/store';
import { detectGenFromFormat } from './detectGenFromFormat';
// import { detectLegacyGen } from './detectLegacyGen';
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

  const gen = detectGenFromFormat(format);
  // const legacy = detectLegacyGen(gen);

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
    useZ,
    useMax,
  } = pokemon;

  // keep track of what moves we have so far to avoid duplicate options
  const filterMoves: MoveName[] = [];

  // also keep track of whether the Pokemon has any actual moves
  // (to determine the group label of the otherMoves, if applicable)
  // let hasActualMoves = false;

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
    // hasActualMoves = true;
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

    // hasActualMoves = true;
  }

  if (serverSourced && serverMoves?.length) {
    const filteredServerMoves = serverMoves.filter((n) => !!n && !filterMoves.includes(n));

    options.push({
      label: transformedForme ? 'Pre-Transform' : 'Current',
      options: filteredServerMoves.map((name) => ({
        label: name,
        value: name,
      })),
    });

    filterMoves.push(...filteredServerMoves);
    // hasActualMoves = true;
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
    // hasActualMoves = true;
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
    // hasActualMoves = true;
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
    // hasActualMoves = true;
  }

  /**
   * @todo temporary workaround for CAP learnsets
   */
  const learnset: MoveName[] = [...(<MoveName[]> moveState?.learnset || [])];
  const isCap = format.includes('cap');

  if (isCap && typeof Dex !== 'undefined' && typeof BattleTeambuilderTable !== 'undefined') {
    const speciesFormeId = formatId(pokemon.speciesForme);
    const learnsetsFromTable = Object.keys(BattleTeambuilderTable.learnsets?.[speciesFormeId] || {})
      .map((n) => !!n && <MoveName> Dex.forGen(gen).moves.get(n)?.name)
      .filter(Boolean);

    if (learnsetsFromTable.length) {
      learnset.push(...learnsetsFromTable);
    }
  }

  if (learnset.length) {
    const learnsetMoves = Array.from(new Set(learnset))
      .filter((n) => !!n && !formatId(n).startsWith('hiddenpower') && !filterMoves.includes(n))
      .sort();

    options.push({
      label: 'Learnset',
      options: learnsetMoves.map((name) => ({
        label: name,
        value: name,
      })),
    });

    filterMoves.push(...learnsetMoves);
    // hasActualMoves = true;
  }

  // Hidden Power moves were introduced in gen 2
  if (gen > 1) {
    // regex filters out 'hiddenpowerfighting70', which is 'hiddenpowerfighting' (BP 60),
    // but with a BP of 70 lol (don't care about the BP here though, we just need the name)
    const unsortedHpMoves = Object.keys(BattleMovedex || {})
      .map((moveid) => <MoveName> Dex.forGen(gen).moves.get(moveid)?.name)
      .filter((n) => !!n && /^hiddenpower[a-z]*$/i.test(formatId(n)) && !filterMoves.includes(n));

    // using a Set makes sure we have no duplicate entries in the array
    const hpMoves = Array.from(new Set(unsortedHpMoves)).sort();

    options.push({
      label: 'Hidden Power',
      options: hpMoves.map((name) => ({
        label: name,
        value: name,
      })),
    });

    filterMoves.push(...hpMoves);
  }

  // show all possible moves if format is not provided, is not legal-locked, or
  // no learnset is available (probably because the Pokemon doesn't exist in the `dex`'s gen)
  const parsedFormat = format?.replace(/^gen\d+/i, '');

  if (!parsedFormat || !LegalLockedFormats.includes(parsedFormat) || !moveState?.learnset?.length) {
    const otherMoves = Object.keys(BattleMovedex || {})
      .map((moveid) => <MoveName> Dex.forGen(gen).moves.get(moveid)?.name)
      .filter((n) => !!n && !filterMoves.includes(n))
      .sort();

    // note: since we need to filter out HP moves, but keep the group last, this is the workaround.
    // splice() will insert at the provided start index, even if an element exists at that index.
    const hiddenPowerIndex = options.findIndex((o) => o.label === 'Hidden Power');
    const insertionIndex = Math.max(hiddenPowerIndex, 0);

    // make sure this comes before the Hidden Power moves
    options.splice(insertionIndex, 0, {
      // label: hasActualMoves ? 'Other' : 'All',
      label: 'All',
      options: otherMoves.map((name) => ({
        label: name,
        value: name,
      })),
    });
  }

  return options;
};
