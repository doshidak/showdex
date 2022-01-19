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

    getPokeballs(): ModdedDex['pokeballs'];
  }
}
