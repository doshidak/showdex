export const PokemonStatNames: Showdown.StatName[] = [
  'hp',
  'atk',
  'def',
  'spa',
  'spd',
  'spe',
];

/**
 * Basically `PokemonStatNames` without `'hp'`,
 * since you can't boost the Pokemon's HP... yet... (right, GameFreak...?)
 */
export const PokemonBoostNames: Showdown.StatNameNoHp[] = [
  'atk',
  'def',
  'spa',
  'spd',
  'spe',
];
