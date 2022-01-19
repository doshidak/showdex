/**
 * battle-scene.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-animations.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  interface BattleScene extends BattleSceneStub {
    battle: Battle;

    /**
     * @default true
     */
    animating: boolean;

    /**
     * @default 1
     */
    acceleration: number;

    /**
     * **NOTE:** Not the actual generation of the battle, but the generation of the sprites/background.
     *
     * @default 7
     */
    gen: number;

    /**
     * @default ''
     */
    mod: string;

    /**
     * * `1` = singles
     * * `2` = doubles
     * * `3` = triples
     *
     * @default 1
     */
    activeCount: number;

    /**
     * @default 0
     */
    numericId: number;

    $frame: JQuery<HTMLElement>;
    $battle?: JQuery<HTMLElement>;
    $options?: JQuery<HTMLElement>;
    $terrain?: JQuery<HTMLElement>;
    $weather?: JQuery<HTMLElement>;
    $bgEffect?: JQuery<HTMLElement>;
    $bg?: JQuery<HTMLElement>;
    $sprite?: JQuery<HTMLElement>;
    $sprites: [JQuery<HTMLElement>?, JQuery<HTMLElement>?];
    $spritesFront: [JQuery<HTMLElement>?, JQuery<HTMLElement>?];
    $stat?: JQuery<HTMLElement>;
    $fx?: JQuery<HTMLElement>;
    $leftbar?: JQuery<HTMLElement>;
    $rightbar?: JQuery<HTMLElement>;
    $turn?: JQuery<HTMLElement>;
    $messagebar?: JQuery<HTMLElement>;
    $delay?: JQuery<HTMLElement>;
    $hiddenMessage?: JQuery<HTMLElement>;
    $tooltips?: JQuery<HTMLElement>;

    log: BattleLog;
    tooltips: BattleTooltips;

    /**
     * @default [{}, {}]
     */
    sideConditions: [{ [id: string]: Sprite[]; }, { [id: string]: Sprite[]; }];

    /**
     * @default 0
     */
    preloadDone: number;

    /**
     * @default 0
     */
    preloadNeeded: boolean;

    bgm?: BattleBGM;

    /**
     * @default ''
     */
    backdropImage: string;

    /**
     * @default 0
     */
    bgmNum: number;

    /**
     * @default {}
     */
    preloadCache: { [url: string]: HTMLImageElement; };

    /**
     * @default false
     */
    messagebarOpen: boolean;

    /**
     * @default false
     */
    customControls: boolean;

    /**
     * @default 1
     */
    interruptionCount: number;

    /**
     * @default ''
     */
    curWeather: string;

    /**
     * @default ''
     */
    curTerrain: string;

    /**
     * @default 0
     */
    timeOffset: number;

    /**
     * @default 0
     */
    pokemonTimeOffset: number;

    /**
     * @default 0
     */
    minDelay: number;

    /**
     * jQuery objects that need to finish animating.
     *
     * @default $()
     */
    activeAnimations: JQuery<HTMLElement>;

    (battle: Battle, $frame: JQuery<HTMLElement>, $logFrame: JQuery<HTMLElement>): this;

    addSprite(sprite: PokemonSprite): void;
    showEffect(effect: string | SpriteData, start: ScenePos, end: ScenePos, transition: string, after?: string): void;
    backgroundEffect(bg: string, duration: number, opacity?: number, delay?: number): void;

    /**
     * Converts a Showdown location (x, y, z, scale, xscale, yscale, opacity) to a
     * jQuery position (top, left, width, height, opacity).
     *
     * * Suitable for passing into `jQuery#css` or `jQuery#animate`.
     * * Display property is passed through if it exists.
     */
    pos(loc: ScenePos, obj: SpriteData): {
      top: number;
      left: number;
      width: number;
      height: number;
      opacity: number;
    };

    /**
     * Converts a Showdown location to a jQuery transition map (see `pos`).
     *
     * * Suitable for passing into `jQuery#animate`.
     * * `oldLoc` is required for ballistic (jumping) animations.
     */
    posT(loc: ScenePos, obj: SpriteData, transition?: string, oldLoc?: ScenePos): {
      top: [number, 'linear' | 'ballistic' | 'ballisticUnder' | 'ballistic2' | 'ballistic2Back' | 'ballistic2Under' | 'swing' | 'quadUp' | 'quadDown'];
      left: [number, 'linear' | 'ballistic' | 'ballisticUnder' | 'ballistic2' | 'ballistic2Back' | 'ballistic2Under' | 'swing' | 'quadUp' | 'quadDown'];
      width: [number, 'linear' | 'ballistic' | 'ballisticUnder' | 'ballistic2' | 'ballistic2Back' | 'ballistic2Under' | 'swing' | 'quadUp' | 'quadDown'];
      height: [number, 'linear' | 'ballistic' | 'ballisticUnder' | 'ballistic2' | 'ballistic2Back' | 'ballistic2Under' | 'swing' | 'quadUp' | 'quadDown'];
      opacity: [number, 'linear' | 'ballistic' | 'ballisticUnder' | 'ballistic2' | 'ballistic2Back' | 'ballistic2Under' | 'swing' | 'quadUp' | 'quadDown'];
    };

    waitFor<T extends HTMLElement = HTMLElement>(elem: JQuery<T>): void;

    getDetailsText(pokemon: Pokemon): string;
    getSidebarHTML(side: Side, posStr: string): string;
    updateLeftSidebar(): void;
    updateRightSidebar(): void;
    resetSides(skipEmpty?: boolean): void;
    rebuildTooltips(): void;
    showJoinButtons(): void;
    hideJoinButtons(): void;
    pseudoWeatherLeft(pWeather: WeatherState): string;
    sideConditionLeft(cond: [string, number, number, number], isFoe: boolean, all?: boolean): string;
    weatherLeft(): string;
    sideConditionsLeft(side: Side, all?: boolean): string;
    preloadImage(url: string): void;
    preloadEffects(): void;
    rollBgm(): void;
    setBgm(bgmNum: number): void;
    static getHPColor(pokemon: { hp: number; maxhp: number; }): HPColor;
  }
}
