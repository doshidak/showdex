export const PokemonNatureBoosts: Record<Showdown.PokemonNature, [up?: Showdown.StatName, down?: Showdown.StatName]> = {
  Adamant: ['atk', 'spa'],
  Bashful: [],
  Bold: ['def', 'atk'],
  Brave: ['atk', 'spe'],
  Calm: ['spd', 'atk'],
  Careful: ['spd', 'spa'],
  Docile: [],
  Gentle: ['spd', 'def'],
  Hardy: [],
  Hasty: ['spe', 'def'],
  Impish: ['def', 'spa'],
  Jolly: ['spe', 'spa'],
  Lax: ['def', 'spd'],
  Lonely: ['atk', 'def'],
  Mild: ['spa', 'def'],
  Modest: ['spa', 'atk'],
  Naive: ['spe', 'spd'],
  Naughty: ['atk', 'spd'],
  Quiet: ['spa', 'spe'],
  Quirky: [],
  Rash: ['spa', 'spd'],
  Relaxed: ['def', 'spe'],
  Sassy: ['spd', 'spe'],
  Serious: [],
  Timid: ['spe', 'atk'],
};

export const PokemonNatures = <Showdown.PokemonNature[]> Object.keys(PokemonNatureBoosts);

export const PokemonBoostedNatures = <Showdown.PokemonNature[]> Object.keys(PokemonNatureBoosts)
  .filter((nature) => PokemonNatureBoosts[<Showdown.PokemonNature> nature].length);
