/**
 * Battle rules (clauses).
 *
 * * Derived from the `stepQueue` in the Showdown `battle` state.
 * * Counter-intuitively, if the value for a given rule is `true`, typically indicates some mechanic is disabled.
 * * Most of these are probably unused, but they're set just in case I decide to use them later.
 *
 * @todo Update this to extract the applied battle rules from the `battle.rules` object (instead of `battle.stepQueue`).
 * @since 0.1.3
 */
export interface CalcdexBattleRules {
  /**
   * Whether only one *Baton Pass*-er is allowed.
   *
   * * Rule: `'One Boost Passer Clause'`
   *   - "Limit one Baton Passer that has a way to boost its stats"
   *
   * @since 1.0.1
   */
  boostPasser?: boolean;

  /**
   * Whether Dynamaxing is banned.
   *
   * * Rule: `'Dynamax Clause'`
   *   - "You cannot dynamax"
   * * Obviously only applies if the current gen is 8.
   *
   * @since 0.1.3
   */
  dynamax?: boolean;

  /**
   * Whether Terastallization is banned.
   *
   * * Rule: `'Terastal Clause'`
   *   - "You cannot Terastallize"
   * * Obviously only applies if the current gen is 9.
   *
   * @since 1.1.7
   */
  tera?: boolean;

  /**
   * Whether evasion abilities, items & moves are banned.
   *
   * * Rule: `'Evasion Clause`'
   *   - "Evasion abilities, items, and moves are banned"
   *
   * @since 1.1.7
   */
  evasion?: boolean;

  /**
   * Whether evasion abilities are banned.
   *
   * * Rule: `'Evasion Abilities Clause'`
   *   - "Evasion abilities are banned"
   *
   * @since 1.1.7
   */
  evasionAbilities?: boolean;

  /**
   * Whether evasion items are banned.
   *
   * * Rule: `'Evasion Items Clause'`
   *   - "Evasion items are banned"
   *
   * @since 0.1.3
   */
  evasionItems?: boolean;

  /**
   * Whether evasion moves are banned.
   *
   * * Rule: `'Evasion Moves Clause'`
   *   - "Evasion moves are banned"
   *
   * @since 0.1.3
   */
  evasionMoves?: boolean;

  /**
   * Whether forcing endless battles are banned.
   *
   * * Rule: `'Endless Battle Clause'`
   *   - "Forcing endless battles is banned"
   *
   * @since 0.1.3
   */
  endlessBattle?: boolean;

  /**
   * Whether only one foe can be frozen.
   *
   * * Rule: `'Freeze Clause Mod'`
   *   - "Limit one foe frozen"
   *
   * @since 1.0.1
   */
  freeze?: boolean;

  /**
   * Whether HP is shown in percentages.
   *
   * * Rule: `'HP Percentage Mod'`
   *   - "HP is shown in percentages"
   * * Only applies to the opponent's Pokemon as we can read the actual HP values from the player's Pokemon via the
   *   corresponding `Showdown.ServerPokemon` objects.
   *
   * @since 0.1.3
   */
  hpPercentage?: boolean;

  /**
   * Whether Rayquaza cannot be mega-evolved.
   *
   * * Rule: `'Mega Rayquaza Clause'`
   *   - "You cannot mega evolve Rayquaza"
   * * Obviously only applies if the current gen is 6 or 7, or we're in some weird format like Gen 8 National Dex.
   *
   * @since 0.1.3
   */
  megaRayquaza?: boolean;

  /**
   * Whether OHKO (one-hit-KO) moves are banned.
   *
   * * Rule: `'OHKO Clause'`
   *   - "OHKO moves are banned"
   *
   * @since 0.1.3
   */
  ohko?: boolean;

  /**
   * Whether Pokemon must share the same type.
   *
   * * Rule: `'Same Type Clause'`
   *   - "Pokémon in a team must share a type"
   * * Typically only present in *monotype* formats.
   *
   * @since 1.0.1
   */
  sameType?: boolean;

  /**
   * Whether only one foe can be put to sleep.
   *
   * * Rule: `'Sleep Clause Mod'`
   *   - "Limit one foe put to sleep"
   *
   * @since 0.1.3
   */
  sleep?: boolean;

  /**
   * Whether players are limited to one of each Pokemon.
   *
   * * Rule: `'Species Clause'`
   *   - "Limit one of each Pokémon"
   *
   * @since 0.1.3
   */
  species?: boolean;
}
