/**
 * scene-pos.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-animations.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  interface ScenePos {
    /** `-` = left, `+` = right */
    x?: number;
    /** `-` = down, `+` = up */
    y?: number;
    /** `-` = player, `+` = opponent */
    z?: number;
    scale?: number;
    xscale?: number;
    yscale?: number;
    opacity?: number;
    time?: number;
    display?: number;
  }

  interface InitScenePos extends ScenePos {
    x: number;
    y: number;
    z: number;
  }
}
