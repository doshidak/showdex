/**
 * battle-dex.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-dex.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  type ColorScheme = 'light' | 'dark';
  type ColorSchemeOption = ColorScheme | 'system';

  interface Dex extends ModdedDex {
    /**
     * @default 9
     */
    readonly gen: number;

    /**
     * @default 'gen9'
     */
    readonly modid: string;

    readonly statNames: ReadonlyArray<StatName>;
    readonly statNamesExceptHP: ReadonlyArray<StatNameNoHp>;

    resourcePrefix: string;
    fxPrefix: string;

    /**
     * @default
     * ```ts
     * {
     *   xy: 1,
     *   bw: 0,
     * }
     * ```
     */
    loadedSpriteData: {
      xy: number;
      bw: number;
    };

    /**
     * @default
     * ```ts
     * {}
     * ```
     */
    moddedDexes: { [mod: string]: ModdedDex; };

    mod(modid: string): ModdedDex;
    forGen(gen: number): this;
    resolveAvatar(avatar: string): string;
    sanitizeName(name: string): string;
    getShortName(name: string): string;
    getEffect(name?: string): PureEffect | Item | Ability | Move;

    prefs(prop: 'theme'): ColorSchemeOption;
    prefs(prop: 'onepanel'): boolean;
    prefs(prop: 'rightpanelbattles'): boolean;
    prefs(prop: 'starredformats'): Record<string, boolean>;
    prefs<T = unknown>(prop: string): T;

    moves: {
      get: (moveOrName?: string | Move) => Move;
    };

    getGen3Category(type: string): 'Special' | 'Physical';

    items: {
      get: (nameOrItem?: string | Item) => Item;
    };

    abilities: {
      get: (nameOrAbility?: string | Ability) => Ability;
    };

    species: {
      get: (nameOrSpecies?: string | Species) => Species;
    };

    types: {
      allCache?: Type[];
      get: (type?: string | Type) => Type;
      all: () => readonly Type[];
      isName: (name?: string) => boolean;
    };

    hasAbility(species: Species, ability: string): boolean;
    loadSpriteData(gen: 'xy' | 'bw'): void;

    getSpriteData(
      pokemon: string | Pokemon | Species,
      isFront: boolean,
      options?: {
        gen?: number;
        shiny?: boolean;
        gender?: GenderName;
        afd?: boolean;
        noScale?: boolean;
        mod?: string;
        dynamax?: boolean;
      },
    ): SpriteData;

    getPokemonIconNum(id: string, isFemale?: boolean, facingLeft?: boolean): number;
    getPokemonIcon(pokemon?: string | Pokemon | ServerPokemon | PokemonSet, facingLeft?: boolean): string;
    getTeambuilderSpriteData(pokemon: Pokemon | ServerPokemon | PokemonSet, gen?: number): TeambuilderSpriteData;
    getTeambuilderSprite(pokemon: Pokemon | ServerPokemon | PokemonSet, gen?: number): string;
    getItemIcon(icon: string | Item): string;
    getTypeIcon(type?: string, b?: boolean): string;
    getCategoryIcon(category?: string): string;
  }
}
