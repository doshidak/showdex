/**
 * sprite.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-animations.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  interface Sprite {
    scene: BattleScene;
    $el?: JQuery<HTMLElement>;
    sp: SpriteData;
    x: number;
    y: number;
    z: number;

    (spriteData?: SpriteData, pos: InitScenePos, scene: BattleScene): this;

    destroy(): void;

    delay(time: number): Sprite;
    anim(end: ScenePos, transition?: string): Sprite;
  }
}
