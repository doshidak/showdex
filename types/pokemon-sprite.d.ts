/**
 * pokemon-sprite.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-animations.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  interface PokemonSprite extends Sprite {
    protected static statusTable: {
      [id: string]: [string, 'good' | 'neutral' | 'bad'] | string;
    };

    /**
     * @default ''
     */
    forme: string;
    cryurl?: string;
    subsp?: SpriteData;

    $sub?: JQuery<HTMLElement>;
    $statbar: JQuery<HTMLElement>;

    /**
     * @default false
     */
    isSubActive: boolean;

    isFrontSprite?: boolean;

    /**
     * @default false
     */
    isMissedPokemon: boolean;

    /**
     * If the Pokemon is transformed, `sprite.sp` will be the transformed `SpriteData` and
     * `sprite.oldsp` will hold the original form's `SpriteData`.
     */
    oldsp?: SpriteData;

    /**
     * @default 0
     */
    statbarLeft: number;

    /**
     * @default 0
     */
    statbarTop: number;

    /**
     * @default 0
     */
    left: number;

    /**
     * @default 0
     */
    top: number;

    /**
     * @default {}
     */
    effects: { [id: string]: Sprite[]; };

    (spriteData?: SpriteData, pos: InitScenePos, scene: BattleScene, isFrontSprite: boolean): this;

    reset(pokemon: Pokemon): void;
    destroy(): void;

    delay(time: number): PokemonSprite;
    anim(end: ScenePos, transition?: string): PokemonSprite;
    behindx(offset: number): number;
    behindy(offset: number): number;
    leftof(offset: number): number;
    behind(offset: number): number;
    removeTransform(): void;
    animSub(instant?: boolean, noAnim?: boolean): void;
    animSubFade(instant?: boolean): void;
    beforeMove(): boolean;
    afterMove(): boolean;
    removeSub(): void;
    animReset(): void;
    recalculatePos(slot: number): void;
    animSummon(pokemon: Pokemon, slot: number, instant?: boolean): void;
    animDragIn(pokemon: Pokemon, slot: number): void;
    animDragOut(pokemon: Pokemon): void;
    animUnsummon(pokemon: Pokemon, instant?: boolean): void;
    animFaint(pokemon: Pokemon): void;
    animTransform(pokemon: Pokemon, isCustomAnim?: boolean, isPermanent?: boolean): void;
    pokeEffect(id: 'protect' | 'magiccoat' | string): void;
    addEffect(id: 'substitute' | 'leechseed' | 'protect' | 'magiccoat' | string, instant?: boolean): void;
    removeEffect(id: 'formechange' | 'substitute' | 'leechseed' | 'protect' | 'magiccoat' | string, instant?: boolean): void;
    clearEffects(): void;
    dogarsCheck(pokemon: Pokemon): void;
    getStatbarHTML(pokemon: Pokemon): string;
    resetStatbar(pokemon: Pokemon, startHidden?: boolean): void;
    updateStatbarIfExists(pokemon: Pokemon, updatePrevhp?: boolean, updateHp?: boolean): void;
    updateStatbar(pokemon: Pokemon, updatePrevhp?: boolean, updateHp?: boolean): void;
    private static getEffectTag(id: string): string;
    updateHPText(pokemon: Pokemon): void;
  }
}
