/**
 * List of Pokemon non-volatile status conditions in a very specific order.
 *
 * * Includes the unknown type `'???'` at the last index.
 * * Ordered according to the status dropdown options in the original Damage Calculator at the link below (kinda).
 *   - Note that "Healthy" isn't a real status, so it's just being manually rendered in `PokeStatusTooltip`, for instance.
 *
 * @see https://calc.pokemonshowdown.com
 * @since 1.1.6
 */
export const PokemonStatuses: Showdown.PokemonStatus[] = [
  'psn', // poison
  'tox', // toxic (aka. badly poisoned)
  'brn', // burn
  'par', // paralysis
  'slp', // sleep
  'frz', // freeze
  '???', // huh
] as Showdown.PokemonStatus[];

/**
 * Pokemon status condition labels.
 *
 * * Works similarly to `PokemonTypeLabels`, except that the `'xm'` case doesn't exist.
 * * Primarily used in `PokeStatus`.
 *
 * @deprecated As of v1.2.1, these are stored in translation strings in `@showdex/assets/i18n`.
 * @since 1.1.6
 */
export const PokemonStatusLabels: Record<Exclude<Showdown.PokemonStatus, '???'>, [full: string, sm: string]> = {
  brn: ['BURNED', 'BRN'],
  frz: ['FROZEN', 'FRZ'],
  par: ['PARLYZ', 'PAR'],
  psn: ['POISON', 'PSN'],
  slp: ['ASLEEP', 'SLP'],
  tox: ['TOXIC', 'TOX'],
};

/**
 * Pokemon status condition titles.
 *
 * * Primarily used in `PokeStatusTooltip`.
 *
 * @deprecated As of v1.2.1, these are stored in translation strings in `@showdex/assets/i18n`.
 * @since 1.1.6
 */
export const PokemonStatusTitles: Record<Showdown.PokemonStatus, string> = {
  '???': 'HUH',
  brn: 'Burned',
  frz: 'Frozen',
  par: 'Paralyzed',
  psn: 'Poisoned',
  slp: 'Asleep',
  tox: 'Badly Poisoned',
};
