export const PokemonStatNames: Showdown.StatName[] = [
  'hp',
  'atk',
  'def',
  'spa',
  'spd',
  'spe',
];

export const PokemonInitialStats: Showdown.StatsTable = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
};

/**
 * Basically `PokemonStatNames` without `'hp'`,
 * since you can't boost the Pokemon's HP... yet... (right, GameFreak...?)
 *
 * @since 0.1.0
 */
export const PokemonBoostNames: Showdown.StatNameNoHp[] = [
  'atk',
  'def',
  'spa',
  'spd',
  'spe',
];

export const PokemonInitialBoosts: Omit<Showdown.StatsTable, 'hp'> = {
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
};
