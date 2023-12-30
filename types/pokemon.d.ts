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
   * Updated on 2023/12/30 from `PokemonSprite.statusTable` in `src/battle-animations.ts` of `smogon/pokemon-showdown-client`.
   *
   * @see https://github.com/smogon/pokemon-showdown-client/blob/0da111e26efefe8ffaaf2632ef95256b51fb66ea/play.pokemonshowdown.com/src/battle-animations.ts#L1756-L1871
   */
  type PokemonVolatile =
    | 'airballoon'
    | 'aquaring'
    | 'attract'
    | 'autotomize'
    | 'beakblast'
    | 'bide'
    | 'bind'
    | 'charge'
    | 'clamp'
    | 'confusion'
    | 'craftyshield'
    | 'curse'
    | 'destinybond'
    | 'disable'
    | 'doomdesire'
    | 'dragoncheer'
    | 'dynamax'
    | 'electrify'
    | 'embargo'
    | 'encore'
    | 'endure'
    | 'fallen1'
    | 'fallen2'
    | 'fallen3'
    | 'fallen4'
    | 'fallen5'
    | 'firespin'
    | 'flashfire'
    | 'focusenergy'
    | 'focuspunch'
    | 'followme'
    | 'foresight'
    | 'formechange'
    | 'futuresight'
    | 'gmaxchistrike'
    | 'glaiverush'
    | 'grudge'
    | 'healblock'
    | 'helpinghand'
    | 'imprison'
    | 'infestation'
    | 'ingrain'
    | 'instruct'
    | 'itemremoved'
    | 'laserfocus'
    | 'leechseed'
    | 'lightscreen' // in gen 1 only
    | 'magiccoat'
    | 'magmastorm'
    | 'magnetrise'
    | 'matblock'
    | 'maxguard'
    | 'mimic'
    | 'miracleeye'
    | 'mist' // legacy gens only
    | 'mudsport'
    | 'mustrecharge'
    | 'nightmare'
    | 'noretreat'
    | 'octolock'
    | 'perish0'
    | 'perish1'
    | 'perish2'
    | 'perish3'
    | 'perishsong'
    | 'powder'
    | 'powertrick'
    | 'protect'
    | 'protosynthesisatk'
    | 'protosynthesisdef'
    | 'protosynthesisspa'
    | 'protosynthesisspd'
    | 'protosynthesisspe'
    | 'quarkdriveatk'
    | 'quarkdrivedef'
    | 'quarkdrivespa'
    | 'quarkdrivespd'
    | 'quarkdrivespe'
    | 'quickguard'
    | 'rage'
    | 'ragepowder'
    | 'reflect' // in gen 1 only
    | 'roost'
    | 'saltcure'
    | 'sandtomb'
    | 'shelltrap'
    | 'slowstart'
    | 'smackdown'
    | 'snaptrap'
    | 'snatch'
    | 'spotlight'
    | 'stockpile'
    | 'stockpile1'
    | 'stockpile2'
    | 'stockpile3'
    | 'substitute'
    | 'syrupbomb'
    | 'tarshot'
    | 'taunt'
    | 'telekinesis'
    | 'throatchop'
    | 'thundercage'
    | 'torment'
    | 'transform'
    | 'trapped'
    | 'typeadd'
    | 'typechange'
    | 'uproar'
    | 'watersport'
    | 'whirlpool'
    | 'wideguard'
    | 'wrap'
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

  type PokemonStats = { [K in StatName]: number; };
  type StatsTable = { [K in StatName]?: number; };
  type StatsTableNoHp = { [K in StatNameNoHp]?: number; };

  /**
   * Note that unlike `Pokemon`, this is a POJO (Plain Ol' JavaScript Object), not a class.
   */
  interface ServerPokemon extends PokemonDetails, PokemonHealth {
    /**
     * Custom property used to consistently track Pokemon.
     *
     * * See `calcdexId` in `Pokemon` for more details.
     *
     * @since 1.0.3
     */
    calcdexId?: string;

    condition: string;
    active: boolean;
    canGmax: boolean;
    commanding: boolean;
    reviving: boolean;

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

    teraType: TypeName | '';
    terastallized: TypeName | '';
  }

  /**
   * Note that this is actually a class in the client.
   */
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
     * Custom property used to track Pokemon since the server does not provide consistent IDs.
     *
     * * Luckily in my testing, I have found that custom properties persist throughout updates,
     *   most likely since the client is updating the existing `Pokemon` when processing updates
     *   from the server.
     *   - Only exception is forme changes, like *Groudon* to *Groudon-Primal*, which is the client
     *     will recreate the Pokemon via the player `Side`'s `addPokemon()`.
     *   - Aforementioned function is overridden in the Calcdex bootstrapper in order to preserve
     *     the old Pokemon's `calcdexId`, should it exist.
     *   - Works consistently well, even in the worse case scenario: a team of all *Arceus-\**.
     *
     * @since 1.0.3
     */
    calcdexId?: string;

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
     * @default ''
     */
    terastallized: TypeName | '';

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
    boosts: { [stat in StatNameNoHp | 'spc']?: number; };

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
    // volatiles: { [effectid?: PokemonVolatile | string]: EffectState; };
    volatiles: Record<string, EffectState>;

    /**
     * @default {}
     */
    // turnstatuses: { [effectid?: PokemonTurnStatus | string]: EffectState; };
    turnstatuses: Record<string, EffectState>;

    /**
     * @default {}
     */
    // movestatuses: { [effectid?: PokemonMoveStatus | string]: EffectState; };
    movestatuses: Record<string, EffectState>;

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
     * @default
     * ```ts
     * {
     *   sleepTurns: 0,
     *   toxicTurns: 0,
     * }
     * ```
     */
    statusData: {
      sleepTurns: number;
      toxicTurns: number;
    };

    /**
     * @default 0
     */
    timesAttacked: number;

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
    getHPText(pokemon: PokemonHealth, precision?: number): string;
  }
}
