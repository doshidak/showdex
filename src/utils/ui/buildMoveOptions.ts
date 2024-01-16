import { type MoveName } from '@smogon/calc';
import { type DropdownOption } from '@showdex/components/form';
import { uarr } from '@showdex/consts/core';
import { type CalcdexBattleField, type CalcdexPokemon, type CalcdexPokemonAlt } from '@showdex/interfaces/calc';
import { formatId } from '@showdex/utils/core';
import {
  detectGenFromFormat,
  getDexForFormat,
  getDynamicMoveType,
  getMaxMove,
  getZMove,
  getPokemonLearnset,
  legalLockedFormat,
} from '@showdex/utils/dex';
import { percentage } from '@showdex/utils/humanize';
import {
  type CalcdexPokemonUsageAltSorter,
  detectUsageAlt,
  flattenAlt,
  flattenAlts,
} from '@showdex/utils/presets';

export type CalcdexPokemonMoveOption = DropdownOption<MoveName>;

/**
 * Builds the value for the `options` prop of the move `Dropdown` component in `PokeMoves`.
 *
 * @since 0.1.3
 */
export const buildMoveOptions = (
  format: string,
  pokemon: CalcdexPokemon,
  config?: {
    usageAlts?: CalcdexPokemonAlt<MoveName>[];
    usageFinder?: (value: MoveName) => string;
    usageSorter?: CalcdexPokemonUsageAltSorter<MoveName>;
    field?: CalcdexBattleField;
    include?: 'all' | 'hidden-power';
    translate?: (value: MoveName) => string;
    translateHeader?: (value: string) => string;
  },
): CalcdexPokemonMoveOption[] => {
  const options: CalcdexPokemonMoveOption[] = [];

  if (!pokemon?.speciesForme) {
    return options;
  }

  const {
    usageAlts,
    usageFinder: findUsagePercent,
    usageSorter,
    field,
    include,
    translate,
    translateHeader,
  } = config || {};

  const dex = getDexForFormat(format);
  const gen = detectGenFromFormat(format);
  const legalLocked = legalLockedFormat(format);
  const showAllMoves = include === 'all' || !legalLocked;

  const ability = pokemon.dirtyAbility ?? pokemon.ability;
  const item = pokemon.dirtyItem ?? pokemon.item;

  const {
    source,
    speciesForme,
    transformedForme,
    moves,
    serverMoves,
    transformedMoves,
    altMoves,
    // moveState,
    revealedMoves,
    useZ,
    useMax,
  } = pokemon;

  // keep track of what moves we have so far to avoid duplicate options
  const filterMoves: MoveName[] = [];

  // since we pass useZ into createSmogonMove(), we need to keep the original move name as the value
  // (but we'll show the corresponding Z move to the user, if any)
  // (also, non-Z moves may appear under the Z-PWR group in the dropdown, but oh well)
  if (useZ && !useMax && moves?.length) {
    const zTuple = moves
      // .filter((n) => !!n && (getZMove(n, item) || n) !== n)
      .map((n) => [
        n,
        (!!n && getZMove(n, {
          moveType: getDynamicMoveType(pokemon, n, {
            format,
            field,
          }),
          item,
        })) || n,
      ])
      .filter(([n, z]) => !!n && !!z && n !== z)
      .sort(([a], [b]) => usageSorter(a, b));

    options.push({
      label: translateHeader?.('Z Moves') || 'Z',
      options: zTuple.map(([name, zMove]) => ({
        label: translate?.(zMove) || zMove,
        rightLabel: findUsagePercent(name),
        subLabel: zMove === name ? null : `${uarr} ${translate?.(name) || name}`,
        value: name,
      })),
    });

    filterMoves.push(...zTuple.map(([n]) => n));
  }

  // unlike Z moves, every move becomes a Max move, hence no initial filtering
  if (useMax && moves?.length) {
    const sortedMoves = [...moves].sort(usageSorter);

    options.push({
      label: translateHeader?.('Max Moves') || 'Max',
      options: sortedMoves.map((name) => {
        const maxMove = getMaxMove(name, {
          moveType: getDynamicMoveType(pokemon, name, {
            format,
            field,
          }),
          speciesForme,
          ability,
        }) || name;

        return {
          label: translate?.(maxMove) || maxMove,
          rightLabel: findUsagePercent(name),
          subLabel: maxMove === name ? null : `${uarr} ${translate?.(name) || name}`,
          value: name,
        };
      }),
    });

    filterMoves.push(...sortedMoves);
  }

  if (source === 'server' && serverMoves?.length) {
    const groupLabel = transformedForme ? 'Pre-Transform' : 'Current';
    const filteredServerMoves = serverMoves
      .filter((n) => !!n && !filterMoves.includes(n))
      .sort(usageSorter);

    options.push({
      label: translateHeader?.(groupLabel) || groupLabel,
      options: filteredServerMoves.map((name) => ({
        label: translate?.(name) || name,
        rightLabel: findUsagePercent(name),
        value: name,
      })),
    });

    filterMoves.push(...filteredServerMoves);
  }

  if (transformedForme && transformedMoves?.length) {
    const filteredTransformedMoves = transformedMoves
      .filter((n) => !!n && !filterMoves.includes(n))
      .sort(usageSorter);

    options.unshift({
      label: translateHeader?.('Transformed') || 'Transformed',
      options: filteredTransformedMoves.map((name) => ({
        label: translate?.(name) || name,
        rightLabel: findUsagePercent(name),
        value: name,
      })),
    });

    filterMoves.push(...filteredTransformedMoves);
  }

  if (revealedMoves?.length) {
    const filteredRevealedMoves = revealedMoves
      .filter((n) => !!n && !filterMoves.includes(n))
      .sort(usageSorter);

    options.push({
      label: translateHeader?.('Revealed Moves') || 'Revealed',
      options: filteredRevealedMoves.map((name) => ({
        label: translate?.(name) || name,
        rightLabel: findUsagePercent(name),
        value: name,
      })),
    });

    filterMoves.push(...filteredRevealedMoves);
  }

  if (altMoves?.length) {
    const unsortedPoolMoves = altMoves
      .filter((a) => !!a && !filterMoves.includes(flattenAlt(a)));

    const poolMoves = flattenAlts(unsortedPoolMoves).sort(usageSorter);

    options.push({
      label: translateHeader?.('Pool') || 'Pool',
      options: poolMoves.map((alt) => ({
        label: translate?.(flattenAlt(alt)) || flattenAlt(alt),
        rightLabel: findUsagePercent(alt),
        value: flattenAlt(alt),
      })),
    });

    filterMoves.push(...poolMoves);
  }

  const remainingUsageMoves = usageAlts?.filter((a) => (
    !!a
      && !!(detectUsageAlt(a) || findUsagePercent(a))
      && !filterMoves.includes(flattenAlt(a))
  ));

  if (remainingUsageMoves?.length) {
    options.push({
      label: translateHeader?.('Usage') || 'Usage',
      options: remainingUsageMoves.map((alt) => ({
        label: translate?.(flattenAlt(alt)) || flattenAlt(alt),
        rightLabel: Array.isArray(alt) ? percentage(alt[1], 2) : findUsagePercent(alt),
        value: flattenAlt(alt),
      })),
    });

    filterMoves.push(...flattenAlts(remainingUsageMoves));
  }

  const learnset = getPokemonLearnset(format, speciesForme, showAllMoves);

  if (transformedForme) {
    learnset.push(...getPokemonLearnset(format, transformedForme, showAllMoves));
  }

  if (learnset.length) {
    const learnsetMoves = Array.from(new Set(learnset))
      .filter((n) => !!n && !formatId(n).startsWith('hiddenpower') && !filterMoves.includes(n))
      .sort(usageSorter);

    options.push({
      label: translateHeader?.('Learnset') || 'Learnset',
      options: learnsetMoves.map((name) => ({
        label: translate?.(name) || name,
        rightLabel: findUsagePercent(name),
        value: name,
      })),
    });

    filterMoves.push(...learnsetMoves);
  }

  // Hidden Power moves were introduced in gen 2
  const includeHiddenPower = gen > 1 && (
    ['all', 'hidden-power'].includes(include)
      || !legalLocked
      || gen < 8 // Hidden Power natively exists in Gens 2-7
      || /nat(?:ional)?dex/i.test(formatId(format))
  );

  if (includeHiddenPower) {
    // regex filters out 'hiddenpowerfighting70', which is 'hiddenpowerfighting' (BP 60),
    // but with a BP of 70 lol (don't care about the BP here though, we just need the name)
    const unsortedHpMoves = Object.keys(BattleMovedex || {})
      .map((moveid) => dex.moves.get(moveid)?.name as MoveName)
      .filter((n) => !!n && /^hiddenpower[a-z]*$/i.test(formatId(n)) && !filterMoves.includes(n));

    // using a Set makes sure we have no duplicate entries in the array
    const hpMoves = Array.from(new Set(unsortedHpMoves)).sort(usageSorter);

    options.push({
      label: translateHeader?.('Hidden Power') || 'Hidden Power',
      options: hpMoves.map((name) => ({
        label: translate?.(name) || name,
        rightLabel: findUsagePercent(name),
        value: name,
      })),
    });

    filterMoves.push(...hpMoves);
  }

  // show all possible moves if the format is not legal-locked or no learnset is available
  if (showAllMoves || !learnset.length) {
    const otherMoves = Object.keys(BattleMovedex || {})
      .map((moveid) => dex.moves.get(moveid)?.name as MoveName)
      .filter((n) => !!n && !/^(?:G-)?Max\s+|Hidden\s*Power/i.test(n) && !filterMoves.includes(n))
      .sort(usageSorter);

    // note: since we need to filter out HP moves, but keep the group last, this is the workaround.
    // splice() will insert at the provided start index, even if an element exists at that index.
    const hiddenPowerIndex = options.findIndex((o) => o.label === 'Hidden Power');
    const insertionIndex = hiddenPowerIndex > -1 ? hiddenPowerIndex : options.length;

    // make sure this comes before the Hidden Power moves
    options.splice(insertionIndex, 0, {
      label: translateHeader?.('All') || 'All',
      options: otherMoves.map((name) => ({
        label: translate?.(name) || name,
        rightLabel: findUsagePercent(name),
        value: name,
      })),
    });
  }

  return options;
};
