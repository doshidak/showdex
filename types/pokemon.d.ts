/**
 * pokemon.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/battle.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  /**
   * `[id, element?, ...misc]`
   */
  type EffectState = [id: string, ...string[]];

  /**
   * `[name, minTimeLeft, maxTimeLeft]`
   */
  type WeatherState = [
    name: string,
    minTimeLeft: number,
    maxTimeLeft: number,
  ];

  type HPColor = 'r' | 'y' | 'g';

  type PokemonStatus =
    // | StatusName
    | 'brn'
    | 'frz'
    | 'par'
    | 'psn'
    | 'slp'
    | 'tox'
    | '???';

  type PokemonRole =
    | 'Physical'
    | 'Special'
    | 'PhysicalAttack'
    | 'SpecialAttack'
    | 'PhysicalSetup'
    | 'SpecialSetup'
    | 'Support'
    | 'Setup'
    | 'Restoration'
    | 'Offense'
    | 'Stall'
    | 'PhysicalStall'
    | 'SpecialStall'
    | 'Fast'
    | 'Ultrafast'
    | 'bulk'
    | 'physicalBulk'
    | 'specialBulk';

  type PokemonNature =
    | 'Adamant'
    | 'Bashful'
    | 'Bold'
    | 'Brave'
    | 'Calm'
    | 'Careful'
    | 'Docile'
    | 'Gentle'
    | 'Hardy'
    | 'Hasty'
    | 'Impish'
    | 'Jolly'
    | 'Lax'
    | 'Lonely'
    | 'Mild'
    | 'Modest'
    | 'Naive'
    | 'Naughty'
    | 'Quiet'
    | 'Quirky'
    | 'Rash'
    | 'Relaxed'
    | 'Sassy'
    | 'Serious'
    | 'Timid';

  /**
   * Adapted from `copyVolatileFrom()` in `js/battle.js` (lines 432, 2418 & 2788) of `smogon/pokemon-showdown-client`.
   */
  type PokemonVolatile =
    | 'airballoon'
    | 'aquaring'
    | 'attract'
    | 'autotomize'
    | 'bide'
    | 'confusion'
    | 'curse'
    | 'disable'
    | 'dynamax'
    | 'embargo'
    | 'encore'
    | 'focusenergy'
    | 'foresight'
    | 'formechange'
    | 'gmaxchistrike'
    | 'healblock'
    | 'imprison'
    | 'laserfocus'
    | 'leechseed'
    | 'magnetrise'
    | 'mimic'
    | 'miracleeye'
    | 'nightmare'
    | 'perish0'
    | 'perish1'
    | 'perish2'
    | 'perish3'
    | 'perishsong'
    | 'powertrick'
    | 'smackdown'
    | 'stockpile'
    | 'stockpile1'
    | 'stockpile2'
    | 'stockpile3'
    | 'substitute'
    | 'taunt'
    | 'telekinesis'
    | 'torment'
    | 'transform'
    | 'typeadd'
    | 'typechange'
    | 'yawn';

  /**
   * Adapted from `getTypes()` in `js/battle.js` (line 482, 1545 & 2669) of `smogon/pokemon-showdown-client`.
   */
  type PokemonTurnStatus =
    | 'beakblast'
    | 'craftyshield'
    | 'destinybond'
    | 'endure'
    | 'focuspunch'
    | 'grudge'
    | 'helpinghand'
    | 'matblock'
    | 'protect'
    | 'quickguard'
    | 'roost'
    | 'shelltrap'
    | 'wideguard';

  /**
   * Adapted from `runMinor()` in `js/battle.js` (line 2029) of `smogon/pokemon-showdown-client`.
   */
  type PokemonMoveStatus =
    | 'mustrecharge';

  interface PokemonAbilityData {
    ability: string;
    baseAbility: string;
    possiblities: string[];
  }

  interface PokemonDetails {
    details: string;
    name: string;
    speciesForme: string;
    level: number;
    shiny: boolean;
    gender: GenderName | '';
    ident: string;
    searchid: string;
  }

  interface PokemonHealth {
    hp: number;
    maxhp: number;
    hpcolor: HPColor | '';
    status: PokemonStatus;
    fainted?: boolean;
  }

  type PokemonStats = { [K in StatNameNoHp]: number; };
  type StatsTable = { [K in StatName]?: number; };

  interface ServerPokemon extends PokemonDetails, PokemonHealth {
    condition: string;
    active: boolean;

    /**
     * Unboosted stats.
     */
    stats: PokemonStats;

    /**
     * Currently an ID, will revise to name.
     */
    moves: string[];

    /**
     * Currently an ID, will revise to name.
     */
    baseAbility: string;

    /**
     * Currently an ID, will revise to name.
     */
    ability?: string;

    /**
     * Currently an ID, will revise to name.
     */
    item: string;

    /**
     * Currently an ID, will revise to name.
     */
    pokeball: string;

    /**
     * * `false` = Pokemon cannot Gigantamax.
     * * Otherwise, `string` containing the full name of its G-Max move.
     */
    gigantamax: string | false;
  }

  interface Pokemon extends PokemonDetails, PokemonHealth {
    /**
     * @default ''
     */
    name: string;

    /**
     * @default ''
     */
    speciesForme: string;

    /**
     * String with the following extractable information:
     * side, nickname.
     *
     * * Will be empty between Team Preview and the first switch-in.
     *
     * @example 'p1: Unown'
     * @example 'p2: Sparky'
     * @default ''
     */
    ident: string;

    /**
     * String with the following extractable information not included in `indent`:
     * species, level, gender, shininess.
     *
     * * Level is omitted if `100`.
     * * Gender is omitted if genderless.
     *
     * **NOTE:** Can be partially filled out in Team Preview,
     * because certain forme information and shininess isn't visible there.
     * In those cases, details can change during the first switch-in,
     * but will otherwise not change over the course of a game.
     *
     * @example 'Mimikyu, L50, F'
     * @example 'Steelix, M, shiny'
     * @default ''
     */
    details: string;

    /**
     * Searchable ID in the format of `'<ident>|<details>'`,
     * tracked for the ease of searching.
     *
     * * As with `ident`, blank before the first switch-in,
     *   and will only change during the first switch-in.
     *
     * @default ''
     */
    searchid: string;

    side: Side;

    /**
     * @default 0
     */
    slot: number;

    /**
     * @default false
     */
    fainted: boolean;

    /**
     * @default 0
     */
    hp: number;

    /**
     * @default 1000
     */
    maxhp: number;

    /**
     * @default 100
     */
    level: number;

    /**
     * @default 'N'
     */
    gender: GenderName;

    /**
     * @default false
     */
    shiny: boolean;

    /**
     * @default 'g'
     */
    hpcolor: HPColor;

    /**
     * @default []
     */
    moves: string[];

    /**
     * @default ''
     */
    ability: string;

    /**
     * @default ''
     */
    baseAbility: string;

    /**
     * @default ''
     */
    item: string;

    /**
     * @default ''
     */
    itemEffect: string;

    /**
     * @default ''
     */
    prevItem: string;

    /**
     * @default ''
     */
    prevItemEffect: string;

    /**
     * @default {}
     */
    boosts: { [stat in StatNameNoHp]?: number; };

    /**
     * @default ''
     */
    status: PokemonStatus | '';

    /**
     * @default 0
     */
    statusStage: number;

    /**
     * @default {}
     */
    volatiles: { [effectid?: PokemonVolatile | string]: EffectState; };

    /**
     * @default {}
     */
    turnstatuses: { [effectid?: PokemonTurnStatus | string]: EffectState; };

    /**
     * @default {}
     */
    movestatuses: { [effectid?: PokemonMoveStatus | string]: EffectState; };

    /**
     * @default ''
     */
    lastMove: string;

    /**
     * `[moveName, ppUsed][]`
     *
     * @default []
     */
    moveTrack: [string, number][];

    /**
     * @default { sleepTurns: 0, toxicTurns: 0 }
     */
    statusData: {
      sleepTurns: number;
      toxicTurns: number;
    };

    sprite: PokemonSprite;

    (data: PokemonDetails, side: Side): this;

    reset(): void;
    destroy(): void;

    isActive(): boolean;

    /** @deprecated */
    getHPColor(): HPColor;

    /** @deprecated */
    getHPColorClass(): string;

    getPixelRange(pixels: number, color?: HPColor): [number, number];
    getFormattedRange(range: [number, number], precision: number, separator: string): string;

    /**
     * Returns `[min, max]` damage dealt as a proportion of the total HP from 0 to 1.
     */
    getDamageRange(damage: number[]): [number, number];

    healthParse(
      hpstring: string,
      parsedamage?: boolean,
      heal?: boolean,
    ): [number, number, number, number?, HPColor?];

    checkDetails(details?: string): boolean;

    getIdent(): string;

    removeVolatile(volatile: string): void;
    addVolatile(volatile: string, ...args: unknown[]): void;
    hasVolatile(volatile: string): boolean;
    clearVolatile(): void;
    clearVolatiles(): void;
    copyVolatileForm(pokemon: Pokemon, copyAll?: boolean): void;

    removeTurnstatus(volatile: string): void;
    addTurnstatus(volatile: string): void;
    hasTurnstatus(volatile: string): boolean;
    clearTurnstatuses(): void;

    removeMovestatus(volatile: string): void;
    addMovestatus(volatile: string): void;
    hasMovestatus(volatile: string): boolean;
    clearMovestatuses(): void;

    rememberMove(moveName: string, pp?: number, recursionSource?: string): void;
    rememberAbility(ability: string, isNotBase?: boolean): void;

    getBoost(boostStat: BoostStatName): string;
    getBoostType(boostStat: BoostStatName): 'good' | 'neutral' | 'bad';
    getWeightKg(serverPokemon?: ServerPokemon): number;

    copyTypesFrom(pokemon: Pokemon): void;
    getTypes(serverPokemon?: ServerPokemon): [ReadonlyArray<TypeName>, TypeName | ''];
    getTypeList(serverPokemon?: ServerPokemon): ReadonlyArray<TypeName>;

    isGrounded(serverPokemon?: ServerPokemon): boolean;
    effectiveAbility(serverPokemon?: ServerPokemon): string;

    getSpeciesForme(serverPokemon?: ServerPokemon): string;
    getSpecies(serverPokemon?: ServerPokemon): string;
    getBaseSpecies(): string;

    /**
     * Used for 2 things:
     *
     * 1. Percentage to display beside the HP bar.
     * 2. Width of the HP bar itself.
     *
     * This is NOT used in the calculation of any other displayed percentages or ranges,
     * which have their own, more complex, formulae.
     */
    hpWidth(maxWidth: number): number;

    getHPText(precision?: number): string;
    static getHPText(pokemon: PokemonHealth, precision?: number): string;
  }
}
