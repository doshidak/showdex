declare namespace Showdown {
  /**
   * Tracks a partial choice, allowing you to built it up one-step at a time,
   * and maybe even construct a UI to build it!
   *
   * Doesn't support going backwards; just use `new BattleChoiceBuilder`.
   */
  interface BattleChoiceBuilder {
    request: BattleRequest;

    /**
     * Completed choices in string form.
     *
     * @default []
     */
    choices: string[];

    /**
     * Currently active partial move choice.
     *
     * * Not used for other choices, which don't have partial states.
     *
     * @default { choiceType: 'move', move: 0, targetLoc: 0, mega: false, ultra: false, max: false, z: false }
     */
    current: BattleMoveChoice;

    /**
     * @default []
     */
    alreadySwitchingIn: number[];

    /**
     * @default false
     */
    alreadyMega: boolean;

    /**
     * @default false
     */
    alreadyMax: boolean;

    /**
     * @default false
     */
    alreadyZ: boolean;

    (request: BattleRequest): this;

    toString(): string;
    isDone(): boolean;
    isEmpty(): boolean;

    /**
     * Index of the current Pokemon to make choices for.
     */
    index(): number;

    /**
     * How many choices is the server expecting?
     */
    requestLength(): number;

    currentMoveRequest(): BattleRequestActivePokemon;
    addChoice(choiceString: string): string;

    /**
     * Move and switch requests will often skip over some active Pokemon,
     * mainly fainted Pokemon.
     *
     * This will fill them in automatically, so we don't need to ask a user for them.
     */
    fillPasses(): void;

    getChosenMove(choice: BattleMoveChoice, pokemonIndex: number): string;

    /**
     * Parses a choice from `string` to `BattleChoice`.
     */
    parseChoice(choice: string): BattleChoice;

    /**
     * Converts a choice from `BattleChoice` to `string`.
     */
    stringChoice(choice: BattleChoice): string;

    /**
     * Fixes the "really gross" server request, according to the dev lol.
     */
    static fixRequest(request: BattleRequest, battle: Battle): void;
  }
}
