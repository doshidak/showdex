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

    /**
     * Client-side localized text for an effect (e.g., `desc`/`shortDesc`).
     *
     * * Note: as of the Showdown client's "Switch to client TL system" refactor (#12299),
     *   descriptions are no longer attached to the data objects returned by `moves.get()`,
     *   `items.get()`, `abilities.get()`, etc., and must be looked up through this method instead.
     *
     * @see https://github.com/smogon/pokemon-showdown/pull/12299
     * @since 1.4.3
     */
    text?: {
      get: (
        effect: Move | Item | Ability | Species | Effect,
        lang?: string,
      ) => {
        name?: string;
        desc?: string;
        shortDesc?: string;
      };
    };

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
