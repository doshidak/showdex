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
  '???',
];

/**
 * Pokemon type abbreviations.
 *
 * * Meant to be rendered directly to the DOM.
 * * Though the ordering of the keys doesn't matter here, they're ordered according to the
 *   Pokemon Type Calculator at the link below.
 *
 * @see https://pkmn.help/defense
 * @since 0.1.0
 */
export const PokemonTypeAbbreviations: Record<Showdown.TypeName, string> = {
  '???': '???',
  Normal: 'NORMAL',
  Fighting: 'FIGHT',
  Flying: 'FLYING',
  Poison: 'POISON',
  Ground: 'GROUND',
  Rock: 'ROCK',
  Bug: 'BUG',
  Ghost: 'GHOST',
  Steel: 'STEEL',
  Fire: 'FIRE',
  Water: 'WATER',
  Grass: 'GRASS',
  Electric: 'ELECTR',
  Psychic: 'PSYCH',
  Ice: 'ICE',
  Dragon: 'DRAGON',
  Dark: 'DARK',
  Fairy: 'FAIRY',
};

/**
 * Shorter Pokemon type abbreviations.
 *
 * * *Shorter* in that the abbreviations have a max of 4 characters.
 * * Like the `PokemonTypeAbbreviations` counterpart, these values are only meant to be rendered directly to the DOM.
 * * Fun fact: this exists to make room for the Gen 9 Tera typing in the UI.
 *
 * @since 1.1.0
 */
export const PokemonTypeShortAbbreviations: Record<Showdown.TypeName, string> = {
  '???': '???',
  Normal: 'NRML',
  Fighting: 'FGHT',
  Flying: 'FLY',
  Poison: 'PSN',
  Ground: 'GRND',
  Rock: 'ROCK',
  Bug: 'BUG',
  Ghost: 'GHST',
  Steel: 'STL',
  Fire: 'FIRE',
  Water: 'WATR',
  Grass: 'GRSS',
  Electric: 'ELCR',
  Psychic: 'PSYC',
  Ice: 'ICE',
  Dragon: 'DRGN',
  Dark: 'DARK',
  Fairy: 'FARY',
};
