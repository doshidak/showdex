/**
 * battle-dex-search.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-dex-search.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  type SearchType =
    | 'pokemon'
    | 'type'
    | 'tier'
    | 'move'
    | 'item'
    | 'ability'
    | 'egggroup'
    | 'category'
    | 'article';

  type SearchRow =
    | [searchType: SearchType, id: string, number?, number?]
    | ['sortpokemon' | 'sortmove', '']
    | ['header' | 'html', string];

  type SearchFilter = [string, string];

  type BattleFormatType =
    | 'doubles'
    | 'bdsp'
    | 'bdspdoubles'
    | 'letsgo'
    | 'metronome'
    | 'natdex'
    | 'nfe'
    | 'dlc1'
    | 'dlc1doubles'
    | 'stadium';

  interface BattleTypedSearch<T extends SearchType> {
    searchType: T;

    /**
     * Dex for the mod/generation to search.
     *
     * @default Dex
     */
    dex: ModdedDex;

    /**
     * Format is the first of the two base filters.
     *
     * * Contains results to things legal in the format, affecting the default sort.
     * * Specifically normalizes out generation number and the words "Doubles" and "Let's Go" from the name.
     *
     * @default ''
     */
    format: string;

    /**
     * Species is the second of the two base filters.
     *
     * * Contains results to things that the species can use, affecting the default sort.
     *
     * @default ''
     */
    species: string;

    /**
     * Set is a pseudo-base filter.
     *
     * * Has minor effects on move sorting.
     * * Abilities/items can affect what moves are sorted as usable.
     */
    set?: PokemonSet;

    protected formatType?: BattleFormatType;

    /**
     * Cached copy of the results list with only base filters.
     *
     * * Base filters implies an empty `query` and `filters`.
     */
    baseResults?: SearchRow[];

    /**
     * Cached copy of all results not in `baseResults`.
     *
     * * Mostly used in cases where the user is wondering why a specific result isn't showing up.
     */
    baseIllegalResults?: SearchRow[];
    illegalReasons?: { [id: string]: string; };

    results?: SearchRow[];
    protected readonly sortRow?: SearchRow;

    (searchType: T, format?: string, speciesOrSet?: string | PokemonSet): this;

    getResults(filters?: SearchFilter[], sortCol?: string, reverseSort?: boolean): SearchRow[];
    protected firstLearnsetid(speciesid: string): string;
    protected nextLearnsetid(learnsetid: string, speciesid: string): string;
    protected canLearn(speciesid: string, moveid: string): boolean;
    getTier(pokemon: Species): string;
    getTable(): Record<string, unknown>;
    getDefaultResults(): SearchRow[];
    getBaseResults(): SearchRow[];
    filter(input: SearchRow, filters: string[][]): boolean;
    sort(input: SearchRow[], sortCol: string, reverseSort?: boolean): SearchRow[];
  }

  type BattlePokemonSearch = BattleTypedSearch<'pokemon'>;
  type BattleAbilitySearch = BattleTypedSearch<'ability'>;
  type BattleItemSearch = BattleTypedSearch<'item'>;

  interface BattleMoveSearch extends BattleTypedSearch<'move'> {
    private moveIsNotUseless(id: string, species: Species, abilityid: string, itemid: string, moves: string[]): boolean;
    static readonly GOOD_STATUS_MOVES: string[];
    static readonly GOOD_WEAK_MOVES: string[];
    static readonly BAD_STRONG_MOVES: string[];
    static readonly GOOD_DOUBLES_MOVES: string[];
  }

  type BattleCategorySearch = BattleTypedSearch<'category'>;
  type BattleTypeSearch = BattleTypedSearch<'type'>;

  interface DexSearch {
    /**
     * @default ''
     */
    query: string;

    /**
     * Dex for the mod/gen to search.
     *
     * @default Dex
     */
    dex: ModdedDex;

    typedSearch?: BattleTypedSearch<SearchType>;

    results?: SearchRow[];

    /**
     * @default false
     */
    exactMatch: boolean;

    static typeTable: {
      pokemon: 1,
      type: 2,
      tier: 3,
      move: 4,
      item: 5,
      ability: 6,
      egggroup: 7,
      category: 8,
      article: 9,
    };

    static typeName: {
      pokemon: 'Pok&eacute;mon',
      type: 'Type',
      tier: 'Tiers',
      move: 'Moves',
      item: 'Items',
      ability: 'Abilities',
      egggroup: 'Egg Groups',
      category: 'Categories',
      article: 'Articles',
    };

    /**
     * @default 'Number'
     */
    firstPokemonColumn: 'Tier' | 'Number';

    /**
     * Column to sort by.
     *
     * * Performs a small sort determined by how good things are according to the base filters,
     *   falling back to the dex number (for Pokemon) and name (for everything else).
     */
    sortCol?: string;

    /**
     * @default false
     */
    reverseSort: boolean;

    /**
     * Filters for the search result.
     *
     * * Does not include the two base filters (Format and Species).
     */
    filters?: SearchFilter[];

    (searchType?: SearchType | '', formatid?: string, species?: string): this;

    getTypedSearch(searchType: SearchType | '', format?: string, speciesOrSet?: string | PokemonSet): BattleTypedSearch<SearchType>;
    find(query: string): boolean;
    setType(searchType: SearchType | '', format?: string, speciesOrSet?: string | PokemonSet): void;
    addFilter(entry: SearchFilter): boolean;
    removeFilter(entry?: SearchFilter): boolean;
    toggleSort(sortCol: string): void;
    filterLabel(filterType: string): 'Filter';
    illegalLabel(id: string): string;
    getTier(species: Species): string;
    textSearch(query: string): SearchRow[];
    private instafilter(searchType: SearchType | '', fType: SearchType, fId: string): SearchRow[];
    static getCloset(query: string): number;
  }
}
