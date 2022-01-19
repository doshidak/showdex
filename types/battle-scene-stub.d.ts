/**
 * battle-scene-stub.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-scene-stub.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  interface BattleSceneStub {
    /**
     * @default false
     */
    animating: boolean;

    acceleration?: number;
    gen?: number;
    activeCount?: number;
    numericId?: number;
    timeOffset?: number;
    interruptionCount?: number;

    /**
     * @default false
     */
    messagebarOpen: boolean;

    /**
     * @default { add: (args, kwargs) => {} }
     */
    log: BattleLog;

    abilityActivateAnim(pokemon: Pokemon, result: string): void;
    addPokemonSprite(pokemon: Pokemon): PokemonSprite;
    addSideCondition(siden: number, id: string, instant?: boolean): void;
    animationOff(): void;
    animationOn(): void;
    maybeCloseMessagebar<TArgs extends Args, TKwArgs extends KwArgs>(args: TArgs, kwArgs?: TKwArgs): boolean;
    closeMessagebar(): boolean;
    damageAnim(pokemon: Pokemon, damage: string | number): void;
    destroy(): void;
    finishAnimations<T extends HTMLElement = HTMLElement>(): JQuery.Promise<JQuery<T>>;
    healAnim(pokemon: Pokemon, damage: string | number): void;
    hideJoinButtons(): void;
    incrementTurn(): void;
    updateAcceleration(): void;
    message(message: string, hiddenMessage?: string): void;
    pause(): void;
    setMute(muted: boolean): void;
    preemptCatchup(): void;
    removeSideCondition(siden: number, id: string): void;
    reset(): void;
    resetBgm(): void;
    updateBgm(): void;
    resultAnim(pokemon: Pokemon, result: string, type: 'bad' | 'good' | 'neutral' | 'par' | 'psn' | 'frz' | 'slp' | 'brn'): void;
    typeAnim(pokemon: Pokemon, types: string): void;
    resume(): void;
    runMoveAnim(moveid: string, participants: Pokemon[]): void;
    runOtherAnim(moveid: string, participants: Pokemon[]): void;
    runPrepareAnim(moveid: string, attacker: Pokemon, defender: Pokemon): void;
    runResidualAnim(moveid: string, pokemon: Pokemon): void;
    runStatusAnim(moveid: string, participants: Pokemon[]): void;
    startAnimations(): void;
    teamPreview(): void;
    resetSides(): void;
    updateGen(): void;
    updateSidebar(side: Side): void;
    updateSidebars(): void;
    updateStatbars(): void;
    updateWeather(instant?: boolean): void;
    upkeepWeather(): void;
    wait(time: number): void;
    setFrameHTML<T = unknown>(html: T): void;
    setControlsHTML<T = unknown>(html: T): void;
    removeEffect(pokemon: Pokemon, id: string, instant?: boolean): void;
    addEffect(pokemon: Pokemon, id: string, instant?: boolean): void;
    animSummon(pokemon: Pokemon, slot: number, instant?: boolean): void;
    animUnsummon(pokemon: Pokemon, instant?: boolean): void;
    animDragIn(pokemon: Pokemon, slot: number): void;
    animDragOut(pokemon: Pokemon): void;
    updateStatbar(pokemon: Pokemon, updatePrevhp?: boolean, updateHp?: boolean): void;
    updateStatbarIfExists(pokemon: Pokemon, updatePrevhp?: boolean, updateHp?: boolean): void;
    animTransform(pokemon: Pokemon, isCustomAnim?: boolean, isPermanent?: boolean): void;
    clearEffects(pokemon: Pokemon): void;
    removeTransform(pokemon: Pokemon): void;
    animFaint(pokemon: Pokemon): void;
    animReset(pokemon: Pokemon): void;
    anim(pokemon: Pokemon, end: ScenePos, transition?: string): void;
    beforeMove(pokemon: Pokemon): void;
    afterMove(pokemon: Pokemon): void;
  }
}
