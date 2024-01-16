import { type ItemName } from '@smogon/calc';
import { type DropdownOption } from '@showdex/components/form';
import { eacute } from '@showdex/consts/core';
import { type CalcdexPokemon, type CalcdexPokemonAlt, type CalcdexPokemonUsageAlt } from '@showdex/interfaces/calc';
import { formatId, nonEmptyObject } from '@showdex/utils/core';
import { detectGenFromFormat, guessTableFormatKey } from '@showdex/utils/dex';
import { percentage } from '@showdex/utils/humanize';
import {
  type CalcdexPokemonUsageAltSorter,
  detectUsageAlt,
  flattenAlt,
  flattenAlts,
} from '@showdex/utils/presets';

export type CalcdexPokemonItemOption = DropdownOption<ItemName>;

/**
 * Local helper function that finds the indices after the `headerName` and before the next header.
 *
 * * `headerName` is a search string, so you don't need to exactly match the name of the header.
 * * `startIndex` is the index of the item **after** the header index, which should be used inclusively.
 * * `endIndex` is the index of the next header or the last index, which should be used inclusively.
 *   - When using `slice()`, since its `end` argument is exclusive, make sure you add `1` to the `endIndex`.
 *
 * @since 1.0.2
 */
const findItemGroupIndices = (
  items: Showdown.BattleTeambuilderGenTable['items'],
  headerName: string,
  startsWith?: boolean,
): [startIndex: number, endIndex: number] => {
  if (!items?.length || !headerName) {
    return [-1, -1];
  }

  // headerName is a search string, so format it as such
  const headerId = formatId(headerName);

  const determinedStartIndex = items.findIndex((value) => (
    Array.isArray(value)
      && formatId(value[1])?.[startsWith ? 'startsWith' : 'includes'](headerId)
  ));

  const startIndex = determinedStartIndex > -1
    ? determinedStartIndex + 1
    : determinedStartIndex;

  const reachedEnd = startIndex > items.length - 1;
  const determinedEndIndex = startIndex > -1
    ? reachedEnd
      ? items.length - 1 - startIndex
      : items.slice(startIndex).findIndex((value) => Array.isArray(value) && value[0] === 'header')
    : -1;

  // if we've found the last header, make sure to return the last index since determinedEndIndex will be -1
  // as there is no header after the last header (duh)
  const endIndex = startIndex > -1 && !reachedEnd && determinedEndIndex < 0
    ? items.length - 1
    : determinedEndIndex + startIndex;

  return [startIndex, endIndex];
};

/**
 * Builds the value for the `options` prop of the items `Dropdown` component in `PokeInfo`.
 *
 * @since 1.0.2
 */
export const buildItemOptions = (
  format: string,
  pokemon: CalcdexPokemon,
  config?: {
    usageAlts?: CalcdexPokemonAlt<ItemName>[];
    usageFinder?: (value: ItemName) => string;
    usageSorter?: CalcdexPokemonUsageAltSorter<ItemName>;
    translate?: (value: ItemName) => string;
    translateHeader?: (value: string) => string;
  },
): CalcdexPokemonItemOption[] => {
  const gen = detectGenFromFormat(format);
  const options: CalcdexPokemonItemOption[] = [];

  if (!pokemon?.speciesForme || gen < 2) {
    return options;
  }

  const { altItems } = pokemon;

  const {
    usageAlts,
    usageFinder: findUsagePercent,
    usageSorter,
    translate,
    translateHeader,
  } = config || {};

  // keep track of what moves we have so far to avoid duplicate options
  const filterItems: ItemName[] = [];

  if (altItems?.length) {
    const hasUsageStats = altItems
      .some((a) => Array.isArray(a) && typeof a[1] === 'number');

    const poolItems = hasUsageStats
      ? altItems // should be sorted already (despite the name)
      : flattenAlts(altItems).sort(usageSorter);

    options.push({
      label: translateHeader?.('Pool') || 'Pool',
      options: poolItems.map((alt) => ({
        label: translate?.(flattenAlt(alt)) || flattenAlt(alt),
        rightLabel: Array.isArray(alt) ? percentage(alt[1], 2) : findUsagePercent(alt),
        value: flattenAlt(alt),
      })),
    });

    filterItems.push(...flattenAlts(poolItems));
  }

  const usageItems = usageAlts?.filter((a) => (
    detectUsageAlt(a)
      && !filterItems.includes(a[0])
  )) as CalcdexPokemonUsageAlt<ItemName>[];

  if (usageItems?.length) {
    options.push({
      label: translateHeader?.('Usage') || 'Usage',
      options: usageItems.map((alt) => ({
        label: translate?.(flattenAlt(alt)) || flattenAlt(alt),
        rightLabel: percentage(alt[1], 2),
        value: flattenAlt(alt),
      })),
    });

    filterItems.push(...flattenAlts(usageItems));
  }

  const formatKey = guessTableFormatKey(format);
  const items = BattleTeambuilderTable[formatKey]?.items || BattleTeambuilderTable?.items;

  // use the BattleTeambuilderTable to group items by:
  // Popular, Items, Pokemon-Specific, Usually Useless & Useless
  const [popularStartIndex, popularEndIndex] = findItemGroupIndices(items, 'popular', true);
  const [itemsStartIndex, itemsEndIndex] = findItemGroupIndices(items, 'items', true);
  const [specificStartIndex, specificEndIndex] = findItemGroupIndices(items, 'specific');
  const [usuallyUselessStartIndex, usuallyUselessEndIndex] = findItemGroupIndices(items, 'usuallyuseless', true);
  const [uselessStartIndex, uselessEndIndex] = findItemGroupIndices(items, 'useless', true);

  if (popularStartIndex > -1 && popularEndIndex > -1) {
    const popularItems = items
      .slice(popularStartIndex, popularEndIndex + 1)
      .map((itemId: string) => Dex.items.get(itemId)?.name as ItemName)
      .filter((n) => !!n && !filterItems.includes(n))
      .sort(usageSorter);

    if (popularItems.length) {
      options.push({
        label: translateHeader?.('Popular Items') || 'Popular',
        options: popularItems.map((name) => ({
          label: translate?.(name) || name,
          rightLabel: findUsagePercent(name),
          value: name,
        })),
      });

      filterItems.push(...popularItems);
    }
  }

  if (itemsStartIndex > -1 && itemsEndIndex > -1) {
    const itemsItems = items // 10/10 name lmao
      .slice(itemsStartIndex, itemsEndIndex + 1)
      .map((itemId: string) => Dex.items.get(itemId)?.name as ItemName)
      .filter((n) => !!n && !filterItems.includes(n))
      .sort(usageSorter);

    if (itemsItems.length) {
      options.push({
        label: translateHeader?.('Items') || 'Items',
        options: itemsItems.map((name) => ({
          label: translate?.(name) || name,
          rightLabel: findUsagePercent(name),
          value: name,
        })),
      });

      filterItems.push(...itemsItems);
    }
  }

  if (specificStartIndex > -1 && specificEndIndex > -1) {
    const specificItems = items
      .slice(specificStartIndex, specificEndIndex + 1)
      .map((itemId: string) => Dex.items.get(itemId)?.name as ItemName)
      .filter((n) => !!n && !filterItems.includes(n))
      .sort(usageSorter);

    if (specificItems.length) {
      options.push({
        label: translateHeader?.(`Pok${eacute}mon-Specific Items`) || `Pok${eacute}mon-Specific`,
        options: specificItems.map((name) => ({
          label: translate?.(name) || name,
          rightLabel: findUsagePercent(name),
          value: name,
        })),
      });

      filterItems.push(...specificItems);
    }
  }

  if (usuallyUselessStartIndex > -1 && usuallyUselessEndIndex > -1) {
    const usuallyUselessItems = items
      .slice(usuallyUselessStartIndex, usuallyUselessEndIndex + 1)
      .map((itemId: string) => Dex.items.get(itemId)?.name as ItemName)
      .filter((n) => !!n && !filterItems.includes(n))
      .sort(usageSorter);

    if (usuallyUselessItems.length) {
      options.push({
        label: translateHeader?.('Usually Useless Items') || 'Usually Useless',
        options: usuallyUselessItems.map((name) => ({
          label: translate?.(name) || name,
          rightLabel: findUsagePercent(name),
          value: name,
        })),
      });

      filterItems.push(...usuallyUselessItems);
    }
  }

  if (uselessStartIndex > -1 && uselessEndIndex > -1) {
    const uselessItems = items
      .slice(uselessStartIndex, uselessEndIndex + 1)
      .map((itemId: string) => Dex.items.get(itemId)?.name as ItemName)
      .filter((n) => !!n && !filterItems.includes(n))
      .sort(usageSorter);

    if (uselessItems.length) {
      options.push({
        label: translateHeader?.('Useless Items') || 'Useless',
        options: uselessItems.map((name) => ({
          label: translate?.(name) || name,
          rightLabel: findUsagePercent(name),
          value: name,
        })),
      });

      filterItems.push(...uselessItems);
    }
  }

  if (!nonEmptyObject(items)) {
    const allItems = Object.values(BattleItems || {})
      .map((item) => item?.name as ItemName)
      .filter((n) => !!n && !filterItems.includes(n))
      .sort(usageSorter);

    if (allItems.length) {
      options.push({
        label: translateHeader?.('Other') || 'Other',
        options: allItems.map((name) => ({
          label: translate?.(name) || name,
          rightLabel: findUsagePercent(name),
          value: name,
        })),
      });
    }

    // return options;
  }

  const otherItems = Object.values(BattleItems || {})
    .map((item) => item?.name as ItemName)
    .filter((n) => !!n && !filterItems.includes(n))
    .sort(usageSorter);

  if (otherItems.length) {
    options.push({
      label: translateHeader?.('All') || 'All',
      options: otherItems.map((name) => ({
        label: translate?.(name) || name,
        rightLabel: findUsagePercent(name),
        value: name,
      })),
    });
  }

  return options;
};
