/**
 * battle-tooltips.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle-tooltips.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  interface BattleTooltips {
    battle: Battle;

    (battle: Battle): this;

    /**
     * @default 350
     */
    static LONG_TAP_DELAY: number;

    /**
     * @default 0
     */
    static longTapTimeout: number;

    static elem?: HTMLDivElement;
    static parentElem?: HTMLElement;

    /**
     * @default false
     */
    static isLocked: boolean;

    /**
     * @default false
     */
    static isPressed: boolean;

    static hideTooltip(): void;
    static cancelLongTap(): void;
    lockTooltip(): void;
    handleTouchEnd(e: TouchEvent): void;
    listen<T extends HTMLElement = HTMLElement>(elem: T | JQuery<T>): void;

    clickTooltipEvent: (e: Event) => void;
    holdLockTooltipEvent: (e: JQuery.TriggeredEvent) => void;
    showTooltipEvent: (e: Event) => void;

    /**
     * Only hides tooltips if they're not locked.
     */
    static unshowTooltip(): void;
    showTooltip<T extends HTMLElement = HTMLElement>(elem: T): void;
    placeTooltip<T extends HTMLElement = HTMLElement>(innerHTML: string, hoveredElem?: T, notRelativeToParent?: boolean, type?: string): void;
    hideTooltip(): void;

    static zMoveEffects: { [zEffect: string]: string; };
    static zMoveTable: { [type in TypeName]: string; };
    static maxMoveTable: { [type in TypeName]: string; };
    getStatusZMoveEffect(move: Move): string;
    getMaxMoveFromType(type: TypeName, gmaxMove?: string | Move): Move;
    showMoveTooltip(move: Move, isZOrMax: string, pokemon: Pokemon, serverPokemon: ServerPokemon, gmaxMove?: Move): string;

    /**
     * Needs either a `Pokemon` or `ServerPokemon`, but note that neither are guaranteed.
     *
     * If you hover over a possible switch-in that's never been switched-in before,
     * you'll only have a `ServerPokemon`, and if you hover over an opponent's Pokemon,
     * you'll only have a `Pokemon`.
     *
     * * `isActive` is `true` if hovering over a Pokemon in the battlefield,
     *   and `false` if hovering over a Pokemon in the Switch menu.
     */
    showPokemonTooltip(clientPokemon?: Pokemon, serverPokemon?: ServerPokemon, isActive?: boolean, illusionIndex?: number): string;

    showFieldTooltip(): string;

    /**
     * Does this Pokemon's trainer have two of these Pokemon that are indistinguishable?
     * (i.e., Does the two Pokemon have the same nickname, species, forme, level, gender, and shininess?)
     */
    pokemonHasClones(pokemon: Pokemon): boolean;

    calculateModifiedStats(clientPokemon: Pokemon, serverPokemon: ServerPokemon): PokemonStats;
    renderStats(clientPokemon?: Pokemon, serverPokemon?: ServerPokemon, short?: boolean): string;
    getPPUseText(moveTrackRow: [string, number], showKnown?: boolean): string;
    ppUsed(move: Move, pokemon: Pokemon): number;

    /**
     * Calculates the possible speed stat range of an opponent's Pokemon.
     */
    getSpeedRange(pokemon: Pokemon): [number, number];

    /**
     * Gets the proper current type for moves with a variable type.
     */
    getMoveType(move: Move, value: ModifiableValue, forMaxMove?: boolean | Move): [TypeName, 'Physical' | 'Special' | 'Status'];

    /**
     * Gets the current accuracy of a move.
     */
    getMoveAccuracy(move: Move, value: ModifiableValue, target?: Pokemon): number;

    /**
     * Gets the proper current base power for moves with a variable base power.
     *
     * * Takes into account the `target` for some moves.
     * * If it's unsure of the actual base power, it gives an estimate.
     */
    getMoveBasePower(move: Move, moveType: TypeName, value: ModifiableValue, target?: Pokemon): number;

    static incenseTypes: { [itemName: string]: TypeName; };
    static itemTypes: { [itemName: string]: TypeName; };
    static orbUsers: { [speciesForme: string]: string; };
    static orbTypes: { [itemName: string]: TypeName; };
    static noGemMoves: string[];

    getItemBoost(move: Move, value: ModifiableValue, moveType: TypeName): number;
    getPokemonTypes(pokemon: Pokemon | ServerPokemon): ReadonlyArray<TypeName>;
    pokemonHasType(pokemon: Pokemon | ServerPokemon, type: TypeName, types?: ReadonlyArray<TypeName>): boolean;
    getAllyAbility(ally: Pokemon): string;
    getPokemonAbilityData(clientPokemon?: Pokemon, serverPokemon?: ServerPokemon): PokemonAbilityData;
    getPokemonAbilityText(clientPokemon?: Pokemon, serverPokemon?: ServerPokemon, isActive?: boolean, hidePossible?: boolean): string;
  }
}
