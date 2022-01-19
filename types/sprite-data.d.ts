/**
 * sprite-data.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-dex.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  interface SpriteData {
    w: number;
    h: number;
    y?: number;
    gen?: number;
    url?: string;
    rawHTML?: string;
    pixelated?: boolean;
    isFrontSprite?: boolean;
    cryurl?: string;
    shiny?: boolean;
  }

  interface TeambuilderSpriteData {
    x: number;
    y: number;
    spriteDir: string;
    spriteid: string;
    shiny?: boolean;
  }
}
