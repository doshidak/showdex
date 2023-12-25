/**
 * List of Pokemon types in a very specific order.
 *
 * * Includes the unknown type `'???'` at the last index.
 * * Ordered according to the type dropdown options in the original Damage Calculator at the link below.
 * * Particularly used by `PokeTypeField` to render all the type options.
 *
 * @see https://calc.pokemonshowdown.com
 * @since 1.0.6
 */
export const PokemonTypes: Showdown.TypeName[] = [
  'Normal',
  'Grass',
  'Fire',
  'Water',
  'Electric',
  'Ice',
  'Flying',
  'Bug',
  'Poison',
  'Ground',
  'Rock',
  'Fighting',
  'Psychic',
  'Ghost',
  'Dragon',
  'Dark',
  'Steel',
  'Fairy',
  'Stellar',
  '???',
];

/**
 * Pokemon type labels.
 *
 * * `full` (index `0`) should be used when the container size is larger than `'sm'`.
 *   - These are primarily based on how types were labeled in older gens, like gen 4.
 *   - They seem to never exceed 6 characters, hence types like Electric are abbreviated into "ELECTR".
 * * `sm` (index `1`) should be used when the container size is `'sm'`.
 *   - For this size, labels do not exceed 4 characters.
 * * `xs` (index `2`) should be used when the container size is `'xs'`.
 *   - For this size, labels do not exceed 3 characters.
 * * Primarily used in `PokeType`.
 *
 * @since 1.1.1
 */
export const PokemonTypeLabels: Record<Exclude<Showdown.TypeName, '???'>, [full: string, sm: string, xs: string]> = {
  Normal: ['NORMAL', 'NRML', 'NRM'],
  Grass: ['GRASS', 'GRSS', 'GRS'],
  Fire: ['FIRE', 'FIRE', 'FRE'],
  Water: ['WATER', 'WATR', 'WTR'],
  Electric: ['ELECTR', 'ELCR', 'ELC'],
  Ice: ['ICE', 'ICE', 'ICE'],
  Flying: ['FLYING', 'FLY', 'FLY'],
  Bug: ['BUG', 'BUG', 'BUG'],
  Poison: ['POISON', 'PSN', 'PSN'],
  Ground: ['GROUND', 'GRND', 'GND'],
  Rock: ['ROCK', 'ROCK', 'RCK'],
  Fighting: ['FIGHT', 'FGHT', 'FGT'],
  Psychic: ['PSYCH', 'PSYC', 'PSY'],
  Ghost: ['GHOST', 'GHST', 'GST'],
  Dragon: ['DRAGON', 'DRGN', 'DRG'],
  Dark: ['DARK', 'DARK', 'DRK'],
  Steel: ['STEEL', 'STL', 'STL'],
  Fairy: ['FAIRY', 'FARY', 'FRY'],
  Stellar: ['STELLR', 'STLR', 'SLR'],
};
