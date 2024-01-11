/**
 * battle.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  type BattleSubscriptionState =
    | 'playing'
    | 'paused'
    | 'turn'
    | 'atqueueend'
    | 'callback'
    | 'ended'
    | 'error';

  type BattleGameType =
    | 'singles'
    | 'doubles'
    | 'triples'
    | 'multi'
    | 'freeforall';

  interface Battle {
    scene: BattleSceneStub;

    /**
     * @deprecated Seems to be `viewpointSwitched` now >:((((((
     * @default false
     */
    sidesSwitched: boolean;

    /**
     * @default false
     */
    viewpointSwitched: boolean;

    stepQueue: string[];

    /**
     * See `battle.instandAdd`.
     *
     * @default []
     */
    preemptStepQueue: string[];

    /**
     * @default true
     */
    waitForAnimations: boolean | 'simult';

    /**
     * Index of the `stepQueue` currently being animated.
     */
    currentStep: number;

    /**
     * Seeking state.
     *
     * * `null` = not seeking
     * * `0` = seek start
     * * `Infinity` = seek end, otherwise seek turn number
     *
     * @default null
     */
    seeking?: number;

    /**
     * @default null
     */
    activeMoveIsSpread?: string;

    subscription?: (state: BattleSubscriptionState) => void;

    /**
     * @default false
     */
    mute: boolean;

    /**
     * @default 300
     */
    messageFadeTime: number;

    /**
     * @default 1
     */
    messageShownTime: number;

    /**
     * Used to time the animation acceleration in long battles full of double-switches.
     *
     * @default 0
     */
    turnSinceMoved: number;

    /**
     * Current turn number.
     *
     * * `-1` = non-battle `RoomGame`s, pre-*Team Preview* or `|start`
     * * `0` = post-*Team Preview* or `|start`, but before `|turn|1`
     *
     * @default -1
     */
    turn: number;

    /**
     * Whether the queue has ended and is waiting on more input.
     *
     * * In addition to at the end of the battle, this is also `true` if you're:
     *   - Playing/watching a battle live, and
     *   - Waiting for a player to make a move.
     *
     * @default false
     */
    atQueueEnd: boolean;

    /**
     * Whether the battle has been played before or fast-forwarded.
     *
     * * Note that this is **not** exactly representative of `turn > 0`.
     * * Should you start watching a replay, pause before turn 1, `turn` will still be `0`,
     *   but playback should be considered to be started.
     * * Specifically used to display "Play" vs. "Resume".
     *
     * @default false
     */
    started: boolean;

    /**
     * Whether the battle reached the point where the player has won or tied.
     *
     * * Affects whether the BGM is playing.
     *
     * @default false
     */
    ended: boolean;

    /**
     * @default false
     */
    isReplay: boolean;

    /**
     * @default false
     */
    usesUpkeep: boolean;

    /**
     * @default ''
     */
    weather: string;

    /**
     * @default []
     */
    pseudoWeather: WeatherState[];

    /**
     * @default 0
     */
    weatherTimeLeft: number;

    /**
     * @default 0
     */
    weatherMinTimeLeft: number;

    /**
     * Side from which perspective we're viewing.
     *
     * * Should be identical to `nearSide`.
     *   - Exception is mutli-battles, where `nearSide` is always the first near side,
     *     and `mySide` is the active player.
     */
    mySide?: Side;
    nearSide?: Side;
    farSide?: Side;
    p1?: Side;
    p2?: Side;
    p3?: Side;
    p4?: Side;

    /**
     * @default 0
     */
    pokemonControlled: number;

    sides?: Side[];
    myPokemon?: ServerPokemon[];
    myAllyPokemon?: ServerPokemon[];

    /**
     * @default ''
     */
    lastMove: string;

    /**
     * @default 8
     */
    gen: number;

    /**
     * @default Dex
     */
    dex: Dex;

    /**
     * @default 0
     */
    teamPreviewCount: number;

    /**
     * @default false
     */
    speciesClause: boolean;

    /**
     * @default ''
     */
    tier: string;

    /**
     * @default 'singles'
     */
    gameType: BattleGameType;

    /**
     * @default false
     */
    rated: string | boolean;

    /**
     * @default false
     */
    isBlitz: boolean;

    /**
     * @default false
     */
    endLastTurnPending: boolean;

    /**
     * @default 0
     */
    totalTimeLeft: number;

    /**
     * @default 0
     */
    graceTimeLeft: number;

    /**
     * * `true` = timer on, state unknown
     * * `false` = timer off
     * * `number` = seconds left this turn
     *
     * @default false
     */
    kickingInactive: number | boolean;

    /**
     * @default ''
     */
    id: string;

    /**
     * Used to forward some information to the room in the old client.
     */
    roomid: string;

    /**
     * @example
     * ```ts
     * // example from gen9nationaldexmonotype:
     * {
     *   'HP Percentage Mod': 1,
     *   'Endless Battle Clause': 1,
     *   'Same Type Clause': 1,
     *   'Terastal Clause': 1,
     *   'Species Clause': 1,
     *   'OHKO Clause': 1,
     *   'Evasion Clause': 1,
     *   'Evasion Abilities Clause': 1,
     *   'Evasion Items Clause': 1,
     *   'Evasion Moves Clause': 1,
     *   'Sleep Clause Mod': 1
     * }
     * ```
     */
    rules: Record<string, number>;

    /**
     * @default false
     */
    hardcoreMode: boolean;

    ignoreNicks: boolean;
    ignoreOpponent: boolean;
    ignoreSpects: boolean;
    forfeitPending: boolean;
    debug: boolean;

    /**
     * @default false
     */
    joinButtons: boolean;

    /**
     * Actual pause state.
     *
     * * Will only be `true` if playback is actually paused,
     *   not just waiting for the opponent to make a move.
     */
    paused: boolean;

    // Showdex-injected custom properties
    calcdexRoom?: HtmlRoom;
    // calcdexOverlayVisible?: boolean;
    calcdexReactRoot?: import('react-dom/client').Root;
    calcdexInit?: boolean;
    calcdexStateInit?: boolean;
    calcdexSheetsAccepted?: boolean;
    calcdexDestroyed?: boolean;
    nonce?: string;

    (options?: {
      $frame?: JQuery<HTMLElement>;
      $logFrame?: JQuery<HTMLElement>;
      id?: string;
      log?: string[];
      paused?: boolean;
      isReplay?: boolean;
      debug?: boolean;
      subscription?: Battle['subscription'];
    }): Battle;

    subscribe(listener: Battle['subscription']): void;

    removePseudoWeather(weather: string): void;
    addPseudoWeather(weather: string, minTimeLeft: number, timeLeft: number): void;
    hasPseudoWeather(weather: string): boolean;
    changeWeather(weatherName: string, poke?: Pokemon, isUpkeep?: boolean, ability?: Effect): void;

    ngasActive(): boolean;

    abilityActive(abilities: string[]): boolean;
    activateAbility(pokemon?: Pokemon, effectOrName: Effect | string, isNotBase?: boolean): void;

    reset(): void;
    resetStep(): void;

    destroy(): void;

    log<
      TArgs extends TArgs,
      TKwArgs extends KwArgs,
    >(args: TArgs, kwArgs?: TKwArgs, preempt?: boolean): void;

    resetToCurrentTurn(): void;
    switchSides(): void;
    setPerspective(sideid: string): void;

    start(): void;
    winner(winner?: string): void;
    prematureEnd(): void;
    endLastTurn(): void;
    setHardcoreMode(mode: boolean): void;
    setTurn(turnNum: number): void;
    resetTurnsSinceMoved(): void;
    swapSideConditions(): void;
    updateTurnCounters(): void;

    useMove<T extends KwArgs>(pokemon: Pokemon, move: Move, target?: Pokemon, kwArgs?: T): void;
    animateMove<T extends KwArgs>(pokemon: Pokemon, move: Move, target?: Pokemon, kwArgs?: T): void;
    cantUseMove<T extends KwArgs>(pokemon: Pokemon, effect: Effect, move: Move, kwArgs?: T): void;

    /**
     * @param name Leave blank for Team Preview.
     * @param pokemonid Leave blank for Team Preview
     */
    parseDetails(name: string, pokemonid: string, details: string, output?: PokemonDetails): PokemonDetails;
    parseHealth(hpstring: string, output?: PokemonHealth): PokemonHealth;
    parsePokemonId(pokemonid: string): {
      name: string;
      siden: number;
      slot: number;
      pokemonid: string;
    };

    getSwitchedPokemon(pokemonid: string, details: string): Pokemon;
    rememberTeamPreviewPokemon(sideid: string, details: string): ReturnType<Side['addPokemon']>;
    findCorrespondingPokemon(serverPokemon: { ident: string; details: string; }): Pokemon;
    getPokemon(pokemonid?: string): Pokemon;
    getSide(sidename: string): Side;
    checkActive(poke: Pokemon): false;

    add(command?: string): void;

    /**
     * Showdown's preempt system is intended to show chat messages immediately,
     * instead of waiting for the battle to arrive at the moment when the message was said.
     *
     * * In addition to being a nice QoL feature,
     *   it's also important to make sure timer updates happen in real-time.
     */
    instantAdd(command: string): void;

    runMinor<
      TArgs extends Args,
      TKwArgs extends KwArgs,
    >(args: TArgs, kwArgs: TKwArgs, nextArgs?: Args, nextKwargs?: TKwArgs): void;

    runMajor<
      TArgs extends Args,
      TKwArgs extends KwArgs,
    >(args: TArgs, kwArgs: TKwArgs, preempt?: boolean): void;

    run(str: string, preempt?: boolean): void;

    /**
     * Properties relevant to battle playback, for replay UI implementers:
     *
     * * `ended` = has the game ended in a win/loss?
     * * `atQueueEnd` = has the animation caught up to the end of the battle queue, waiting for more input?
     * * `seeking` = are we trying to skip to a specific turn?
     * * `turn` = what turn are we currently on?
     *   - `-1` = we haven't started yet
     *   - `0` = Team Preview
     * * `paused` = are we playing at all?
     */
    play(): void;
    pause(): void;
    skipTurn(): void;
    seekTurn(turn: number, forceReset?: boolean): void;
    stopSeeking(): void;
    shouldStep(): boolean;
    nextStep(): void;
    setQueue(queue: string[]): void;
    setMute(mute: boolean): void;
  }
}
