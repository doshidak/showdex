import { formatId } from '@showdex/utils/app';
import type { ItemName } from '@pkmn/data';
import type { CalcdexPokemon } from '@showdex/redux/store';

export interface PokemonItemOption {
  label: string;
  options: {
    label: string;
    value: ItemName;
  }[];
}

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

  const determinedStartIndex = items
    .findIndex((value) => Array.isArray(value) && formatId(value[1])?.[startsWith ? 'startsWith' : 'includes'](headerId));

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
 * * As of v1.0.1, we're opting to use the global `Dex` object as opposed to the `dex` from `@pkmn/dex`
 *   since we still get back information even if we're not in the correct gen (especially in National Dex formats).
 *
 * @since 1.0.2
 */
export const buildItemOptions = (
  format: string,
  pokemon: DeepPartial<CalcdexPokemon>,
): PokemonItemOption[] => {
  const options: PokemonItemOption[] = [];

  if (!pokemon?.speciesForme) {
    return options;
  }

  const {
    altItems,
  } = pokemon;

  // keep track of what moves we have so far to avoid duplicate options
  const filterItems: ItemName[] = [];

  if (altItems?.length) {
    const poolItems = altItems.filter(Boolean).sort();

    options.push({
      label: 'Pool',
      options: poolItems.map((name) => ({
        label: name,
        value: name,
      })),
    });

    filterItems.push(...poolItems);
  }

  if (typeof Dex === 'undefined') {
    return options;
  }

  if (typeof BattleTeambuilderTable === 'undefined' || !format || !BattleTeambuilderTable.items?.length) {
    const allItems = Object.values(BattleItems || {})
      .map((item) => <ItemName> item?.name)
      .filter((n) => !!n && !filterItems.includes(n))
      .sort();

    if (allItems.length) {
      options.push({
        label: 'All',
        options: allItems.map((name) => ({
          label: name,
          value: name,
        })),
      });
    }

    return options;
  }

  // reversing the order so that sub-formats like gen7letsgo comes before gen7
  // (note: there's no gen8, only gen8dlc1. however, there is a gen8doubles and a gen8dlc1doubles,
  // so we can't simply remove 'dlc1'; hence why we're filtering out gen8doubles since it comes before gen8dlc1doubles)
  const genFormatKeys = <Showdown.BattleTeambuilderTableFormat[]> Object.keys(BattleTeambuilderTable)
    .filter((key) => !!key && key.startsWith('gen') && key !== 'gen8doubles')
    .sort()
    .reverse();

  const formatKey = format.includes('nationaldex')
    ? 'natdex'
    : format.includes('metronome')
      ? 'metronome'
      : genFormatKeys.find((key) => format.includes(key.replace(/dlc\d?/i, '')));

  // const { items } = BattleTeambuilderTable;
  const items = formatKey in BattleTeambuilderTable && Array.isArray(BattleTeambuilderTable[formatKey]?.items)
    ? BattleTeambuilderTable[formatKey].items
    : BattleTeambuilderTable.items;

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
      .map((itemId: string) => <ItemName> Dex.items.get(itemId)?.name)
      .filter((n) => !!n && !filterItems.includes(n))
      .sort();

    if (popularItems.length) {
      options.push({
        label: 'Popular',
        options: popularItems.map((name) => ({
          label: name,
          value: name,
        })),
      });

      filterItems.push(...popularItems);
    }
  }

  if (itemsStartIndex > -1 && itemsEndIndex > -1) {
    const itemsItems = items // 10/10 name lmao
      .slice(itemsStartIndex, itemsEndIndex + 1)
      .map((itemId: string) => <ItemName> Dex.items.get(itemId)?.name)
      .filter((n) => !!n && !filterItems.includes(n))
      .sort();

    if (itemsItems.length) {
      options.push({
        label: 'Items',
        options: itemsItems.map((name) => ({
          label: name,
          value: name,
        })),
      });

      filterItems.push(...itemsItems);
    }
  }

  if (specificStartIndex > -1 && specificEndIndex > -1) {
    const specificItems = items
      .slice(specificStartIndex, specificEndIndex + 1)
      .map((itemId: string) => <ItemName> Dex.items.get(itemId)?.name)
      .filter((n) => !!n && !filterItems.includes(n))
      .sort();

    if (specificItems.length) {
      options.push({
        label: 'Pok\u00E9mon-Specific', // U+00E9 is the accented 'e' character
        options: specificItems.map((name) => ({
          label: name,
          value: name,
        })),
      });

      filterItems.push(...specificItems);
    }
  }

  if (usuallyUselessStartIndex > -1 && usuallyUselessEndIndex > -1) {
    const usuallyUselessItems = items
      .slice(usuallyUselessStartIndex, usuallyUselessEndIndex + 1)
      .map((itemId: string) => <ItemName> Dex.items.get(itemId)?.name)
      .filter((n) => !!n && !filterItems.includes(n))
      .sort();

    if (usuallyUselessItems.length) {
      options.push({
        label: 'Usually Useless',
        options: usuallyUselessItems.map((name) => ({
          label: name,
          value: name,
        })),
      });

      filterItems.push(...usuallyUselessItems);
    }
  }

  if (uselessStartIndex > -1 && uselessEndIndex > -1) {
    const uselessItems = items
      .slice(uselessStartIndex, uselessEndIndex + 1)
      .map((itemId: string) => <ItemName> Dex.items.get(itemId)?.name)
      .filter((n) => !!n && !filterItems.includes(n))
      .sort();

    if (uselessItems.length) {
      options.push({
        label: 'Useless',
        options: uselessItems.map((name) => ({
          label: name,
          value: name,
        })),
      });
    }
  }

  return options;
};
