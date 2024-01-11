/**
 * battle-teambuilder-table.d.ts
 *
 * Adapted from `pokemon-showdown-client/build-tools/build-indexes`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */

declare namespace Showdown {
  type BattleTeambuilderTableFormatCode =
    | 'AG'
    | 'CAP' // note: this one doesn't actually exist & is used only by Showdex to refer to the 0 index
    | 'CAP LC'
    | 'DNU' // doubles NU
    | 'DOU' // doubles OU
    | 'DUber'
    | 'DUU'
    | 'LC'
    | 'Mythical'
    | 'NFE'
    | 'NU'
    | 'New'
    | 'OU'
    | 'PU'
    | 'Regular'
    | 'Restricted Legendary'
    | 'RU'
    | 'UU'
    | 'Uber'
    | 'ZU';

  type BattleTeambuilderTableTier =
    | [type: 'header', name: string]
    | [type: 'pokemon', speciesId: string]
    | string;

  interface BattleTeambuilderGenTable {
    /**
     * Starting index of `tiers[]` for the list of Pokemon within a format.
     *
     * * Index includes the header, so make sure to add `1` to ignore it.
     * * `tiers[]` are specifically ordered, so you can simply include the remaining elements (e.g., OU will include UUBL, UU, RUBL, etc.).
     *
     * @example
     * ```ts
     * {
     *   AG: 72,
     *   'CAP LC': 45,
     *   LC: 670,
     *   NFE: 577,
     *   NU: 313,
     *   New: 577,
     *   OU: 154,
     *   PU: 367,
     *   RU: 257,
     *   UU: 207,
     *   Uber: 109,
     *   ZU: 410.
     * }
     * ```
     */
    formatSlices: Partial<Record<BattleTeambuilderTableFormatCode, number>>;

    /**
     * Item list.
     *
     * * All item names are formatted as an ID (e.g., `'choiceband'` instead of `'Choice Band'`).
     * * If an element is an array, typically indicates a header in which items (denoted by type `string` elements)
     *   before the next header belong to that header.
     *
     * @example
     * ```ts
     * [
     *   ['header', 'Popular items'],
     *   'aguavberry',
     *   'assaultvest',
     *   ...,
     *   ['header', 'Items'],
     *   'absorbbulb',
     *   'adrenalineorb',
     *   ...,
     *   ['header', 'Pok&eacute;mon-specific items'],
     *   'adamantorb',
     *   'bugmemory',
     *   ...,
     *   ['header', 'Usually useless items'],
     *   'aspearberry',
     *   'bigroot',
     *   ...,
     *   ['header', 'Useless items'],
     *   'beastball',
     *   'berrysweet',
     *   ...,
     *   'waterstone',
     *   'whippeddream',
     * ]
     * ```
     */
    items?: ([type: 'header', name: string] | string)[];

    /**
     * Item sets.
     *
     * * Differs from `item` in that every element is a tuple, instead of only headers being tuples and item names being `string`s.
     * * Seems to be only present in the `natdex` format.
     */
    itemSet?: [type: 'header' | 'item', nameOrItemId: string][];

    /**
     * Pokemon legal learnsets.
     *
     * * Key is the ID'd species forme of the Pokemon (e.g., `'tapulele' instead of `'Tapu Lele'`).
     *   - Note that some Pokemon's alternative formes like `'Zygarde-10%'` is available (under `'zygarde10'`),
     *     but others like `'Charizard-Mega-X'` must have its alternative forme removed (e.g., `'charizard'` as `'charizardmegax'` doesn't exist).
     * * Value is an object whose keys are ID'd moves (e.g., `'bugbuzz'` instead of `'Bug Buzz'`) and
     *   values are a string of gen numbers that the move is legally learnable in (e.g., `'45678qg'`).
     *   - No idea what the letters mean, except for `'V'`, indicating "VC only," which "VC" could mean *Virtual Console*.
     *   - Other letters include: `'p'` if the legal gens include 6, `'q'` if the legal gens includes 7 and is not "VC only," and
     *     `'g'` if the legal gens include 8 and is not "VC only."
     *
     * @example
     * ```ts
     * {
     *   abomasnow: {
     *     attract: '45678pqg',
     *     auroraveil: '8g',
     *     ...,
     *   },
     *   abra: { allyswitch: '5678pqg', attract: '2345678pqg', ... },
     *   ...,
     *   zygarde: { bind: '678pqg', bite: '678pqg', ... },
     *   zygarde10: { bind: '78qg', dig: '78q', ... },
     * }
     * ```
     */
    learnsets?: {
      [speciesFormeId: string]: {
        [moveId: string]: string;
      };
    };

    /**
     * Monotype bans.
     *
     * * Key is the ID'd species forme of the Pokemon.
     * * Value seems to always be `1`, probably indicating `true`.
     *
     * @example
     * ```ts
     * {
     *   blaziken: 1,
     *   blazikenmega: 1,
     *   ...,
     *   zekrom: 1,
     *   zygarde: 1,
     * }
     * ```
     */
    monotypeBans?: {
      [speciesFormeId: string]: 1;
    };

    /**
     * Non-standard moves.
     *
     * * All move names are formatted as an ID (e.g., `'astralbarrage'` instead of `'Astral Barrage'`).
     *
     * @example
     * ```ts
     * [
     *   'aeroblast',
     *   'astralbarrage',
     *   ...,
     *   'thundercage',
     *   'thunderouskick',
     * ]
     * ```
     */
    nonstandardMoves?: string[];

    /**
     * Ability overrides.
     */
    overrideAbilityData?: {
      [abilityId: string]: DeepPartial<Writable<Ability>>;
    };

    /**
     * Item description overrides.
     */
    overrideItemDesc?: {
      [itemId: string]: string;
    };

    /**
     * Move overrides.
     */
    overrideMoveData?: {
      [moveId: string]: DeepPartial<Writable<Move>>;
    };

    /**
     * Pokemon species forme overrides.
     */
    overrideSpeciesData?: {
      [speciesFormeId: string]: DeepPartial<Writable<Pokemon>>;
    };

    /**
     * Pokemon tier overrides.
     *
     * * Key is the ID'd species forme of the Pokemon.
     * * Value seems to be the format name or `'Illegal'`, although some are in parentheses (like `'(PU)'`),
     *   which I'm not entirely sure what that indicates.
     *
     * @example
     * ```ts
     * {
     *   abomasnow: '(PU)',
     *   abomasnowmega: 'Illegal',
     *   abra: 'LC',
     *   absol: 'PU',
     *   ...,
     *   zweilous: 'NFE',
     *   zygarde: 'Uber',
     *   zygarde10: 'UU',
     *   zygardecomplete: 'Uber',
     * }
     * ```
     */
    overrideTier?: {
      [speciesFormeId: string]: string;
    };

    /**
     * Type overrides.
     */
    overrideTypeChart?: {
      [typeName?: Exclude<TypeName, '???'>]: {
        HPdvs?: Partial<Record<StatNameNoHp, number>>;
        HPivs?: Partial<Record<StatNameNoHp, number>>;
        damageTaken?: Partial<Record<Exclude<TypeName, '???'>, number>>;
      };
    };

    /**
     * Pokemon tiers.
     *
     * * All Pokemon species formes are formatted as an ID (e.g., `'alcremiegmax'` instead of `'Alcremie-Gmax'`).
     * * If an element is an array, typically indicates a header in which species (denoted by type `string` elements)
     *   before the next header belong to that header.
     *
     * @example
     * ```ts
     * [
     *   ['header', 'CAP'],
     *   'arghonaut',
     *   'astrolotl',
     *   ...,
     *   ['header', 'CAP NFE'],
     *   'argalis',
     *   'caimanoe',
     *   ...,
     *   ['header', 'CAP LC'],
     *   'brattler',
     *   'breezi',
     *   ...,
     *   ['header', 'AG'],
     *   'alcremiegmax',
     *   'appletungmax',
     *   ...,
     * ]
     * ```
     */
    tiers: BattleTeambuilderTableTier[];

    /**
     * Strangely, the Teambuilder will move `tiers[]` to this when showing the list of Pokemon.
     *
     * * It also sets `tiers[]` to `null`, so make sure you pull from both `tiers[]` & this, just in case.
     */
    tierSet: BattleTeambuilderTableTier[];

    /**
     * Types to remove.
     */
    removeType?: {
      [typeName?: Exclude<TypeName, '???'>]: true;
    };

    /**
     * National Dex Doubles bans.
     */
    ndDoublesBans?: {
      [speciesFormeId: string]: 1;
    };

    /**
     * ZU (Zero-Used) bans.
     *
     * * Key is the ID'd species forme of the Pokemon.
     * * Value seems to always be `1`, probably indicating `true`.
     *
     * @example
     * ```ts
     * {
     *   arctovish: 1,
     *   aurorus: 1,
     *   ...,
     *   turtonator: 1,
     *   vikavolt: 1,
     * }
     * ```
     */
    zuBans?: {
      [speciesFormeId: string]: 1;
    };

    /**
     * Ubers UU bans.
     *
     * * Same as `zuBans`.
     */
    ubersUUBans?: {
      [speciesFormeId: string]: 1;
    };
  }

  type BattleTeambuilderTableFormat =
    | 'bh'
    | 'gen1'
    | 'gen1lc'
    | 'gen1nfe'
    | 'gen1stadium'
    | 'gen2'
    | 'gen2lc'
    | 'gen2nfe'
    | 'gen2stadium2'
    | 'gen3'
    | 'gen3doubles'
    | 'gen3lc'
    | 'gen3nfe'
    | 'gen4'
    | 'gen4doubles'
    | 'gen4nfe'
    | 'gen4vgc'
    | 'gen5'
    | 'gen5doubles'
    | 'gen5lc'
    | 'gen5nfe'
    | 'gen5vgc'
    | 'gen6'
    | 'gen6doubles'
    | 'gen6lc'
    | 'gen6nfe'
    | 'gen6vgc'
    | 'gen7'
    | 'gen7doubles'
    | 'gen7lc'
    | 'gen7letsgo'
    | 'gen7nfe'
    | 'gen7vgc'
    | 'gen8' // doesn't exist! -- update (2023/07/21): now it apparently does lol
    | 'gen8bdsp'
    | 'gen8bdspdoubles'
    | 'gen8dlc1'
    | 'gen8dlc1doubles'
    | 'gen8doubles'
    | 'gen8lc'
    | 'gen8metronome'
    | 'gen8natdex'
    | 'gen8nfe'
    | 'gen8vgc'
    | 'gen9' // but this? doesn't exist!
    | 'gen9dlc1'
    | 'gen9dlc1doubles'
    | 'gen9doubles'
    | 'gen9lc'
    | 'gen9metronome'
    | 'gen9natdex'
    | 'gen9nfe'
    | 'gen9predlc'
    | 'gen9predlcdoubles'
    | 'gen9vgc';

  type BattleTeambuilderTable =
    & Pick<Required<BattleTeambuilderGenTable>, 'formatSlices' | 'items' | 'learnsets' | 'monotypeBans' | 'ndDoublesBans' | 'overrideTier' | 'tiers' | 'tierSet' | 'ubersUUBans' | 'zuBans'>
    & Record<BattleTeambuilderTableFormat, BattleTeambuilderGenTable>;
}
