type OmittedShowdownSideKeys =
  | 'active'
  | 'ally'
  | 'battle'
  | 'faintCounter'
  | 'foe'
  | 'isFar'
  | 'lastPokemon'
  | 'missedPokemon'
  | 'n'
  | 'pokemon'
  | 'rating'
  | 'sideConditions'
  | 'wisher'
  | 'x'
  | 'y'
  | 'z';

/**
 * Lean version of the `Showdown.Side` object used by the official client.
 *
 * * Basically `Showdown.Side` without the class functions like `addSideCondition()`.
 *
 * @since 0.1.0
 */
export type CalcdexLeanSide = Partial<Omit<NonFunctionProperties<Showdown.Side>, OmittedShowdownSideKeys>>;
