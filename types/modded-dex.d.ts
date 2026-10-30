/**
 * modded-dex.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-dex.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  interface ModdedDex {
    readonly gen: number;
    readonly modid: string;

    readonly cache: {
      Moves: { [K: string]: Move; };
      Items: { [K: string]: Item; };
      Abilities: { [K: string]: Ability; };
      Species: { [K: string]: Species; };
      Types: { [K: string]: Effect; };
    };

    pokeballs?: string[];

    (modid: string): this;

    moves: {
      get: (name: string) => Move;
    };

    items: {
      get: (name: string) => Item;
    };

    abilities: {
      get: (name: string) => Ability;
    };

    species: {
      get: (name: string) => Species;
    };

    types: {
      get: (name: string) => Type;
    };

    /**
     * Translated text lookups, which is where `desc` & `shortDesc` now live (sourced from `data/text/{lang}.js`).
     *
     * * Not available in older clients, which instead populate `desc` & `shortDesc` directly on the `Effect`.
     * * Note that `get()` will throw if the global `BattleText` hasn't been loaded yet.
     */
    text?: {
      getLanguage: () => string;
      get: (effect: Ability | Item | Move, lang?: string) => {
        name: string;
        desc?: string;
        shortDesc?: string;
      };
    };

    getPokeballs(): ModdedDex['pokeballs'];
  }
}
