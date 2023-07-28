import { type ItemName } from '@smogon/calc';

/**
 * Items that reduce the holder's SPE.
 *
 * @since 0.1.3
 */
export const PokemonSpeedReductionItems: ItemName[] = [
  'Macho Brace',
  'Power Anklet',
  'Power Band',
  'Power Belt',
  'Power Bracer',
  'Power Lens',
  'Power Weight',
] as ItemName[];

/**
 * Items that associate with a stat.
 *
 * @see https://github.com/smogon/damage-calc/blob/5f9239f743f343f6fcb174399163854d66e5abe3/calc/src/items.ts#L4-L9
 * @since 1.1.6
 */
export const PokemonStatAssociativeItems: Record<ItemName, Showdown.StatName> = {
  'Electric Seed': 'def',
  'Grassy Seed': 'def',
  'Misty Seed': 'spd',
  'Psychic Seed': 'spd',
} as Record<ItemName, Showdown.StatName>;

/**
 * Items that associate with a type.
 *
 * * These items can:
 *   - Influence the *type* of a move (e.g., *Iron Plate* turning *Judgment* into a Steel-type move),
 *   - Boost the *power* (i.e., resulting damage) of a move with a matching type (e.g., *Rock Incense* boosting Rock-type moves by 20%), or
 *   - Provide *resistance* to damage of a matching type (e.g., *Shuca Berry* reducing super-effective damages from Ground-type moves by 50%).
 * * Note that this mapping does not distinguish between these features.
 *   - They will depend on the context that this mapping is being used in, i.e., you'll need to know what you're looking for!
 *   - For instance, this is used in `getDynamicMoveType()` to determine the type of *Judgment* based on the held item.
 *
 * @see https://github.com/smogon/damage-calc/blob/5f9239f743f343f6fcb174399163854d66e5abe3/calc/src/items.ts#L11-L75
 * @see https://github.com/smogon/damage-calc/blob/5f9239f743f343f6fcb174399163854d66e5abe3/calc/src/items.ts#L77-L118
 * @see https://github.com/smogon/damage-calc/blob/5f9239f743f343f6fcb174399163854d66e5abe3/calc/src/items.ts#L402-L415
 * @see https://github.com/smogon/damage-calc/blob/5f9239f743f343f6fcb174399163854d66e5abe3/calc/src/items.ts#L417-L422
 * @since 1.1.6
 */
export const PokemonTypeAssociativeItems: Record<ItemName, Showdown.TypeName> = {
  'Babiri Berry': 'Steel',
  'Black Belt': 'Fighting',
  'Black Glasses': 'Dark',
  'Bug Memory': 'Bug',
  'Burn Drive': 'Fire',
  Charcoal: 'Fire',
  'Charti Berry': 'Rock',
  'Chilan Berry': 'Normal',
  'Chill Drive': 'Ice',
  'Chople Berry': 'Fighting',
  'Coba Berry': 'Flying',
  'Colbur Berry': 'Dark',
  'Dark Memory': 'Dark',
  'Douse Drive': 'Water',
  'Draco Plate': 'Dragon',
  'Dragon Fang': 'Dragon',
  'Dragon Memory': 'Dragon',
  'Dread Plate': 'Dark',
  'Earth Plate': 'Ground',
  'Electric Memory': 'Electric',
  'Fairy Memory': 'Fairy',
  'Fighting Memory': 'Fighting',
  'Fire Memory': 'Fire',
  'Fist Plate': 'Fighting',
  'Flame Plate': 'Fire',
  'Flying Memory': 'Flying',
  'Ghost Memory': 'Ghost',
  'Grass Memory': 'Grass',
  'Ground Memory': 'Ground',
  'Haban Berry': 'Dragon',
  'Hard Stone': 'Rock',
  'Ice Memory': 'Ice',
  'Icicle Plate': 'Ice',
  'Insect Plate': 'Bug',
  'Iron Plate': 'Steel',
  'Kasib Berry': 'Ghost',
  'Kebia Berry': 'Poison',
  Magnet: 'Electric',
  'Meadow Plate': 'Grass',
  'Metal Coat': 'Steel',
  'Mind Plate': 'Psychic',
  'Miracle Seed': 'Grass',
  'Mystic Water': 'Water',
  'Never-Melt Ice': 'Ice',
  'Occa Berry': 'Fire',
  'Odd Incense': 'Psychic',
  'Passho Berry': 'Water',
  'Payapa Berry': 'Psychic',
  'Pink Bow': 'Normal',
  'Pixie Plate': 'Fairy',
  'Poison Barb': 'Poison',
  'Poison Memory': 'Poison',
  'Polkadot Bow': 'Normal',
  'Psychic Memory': 'Psychic',
  'Rindo Berry': 'Grass',
  'Rock Incense': 'Rock',
  'Rock Memory': 'Rock',
  'Rose Incense': 'Grass',
  'Roseli Berry': 'Fairy',
  'Sea Incense': 'Water',
  'Sharp Beak': 'Flying',
  'Shock Drive': 'Electric',
  'Shuca Berry': 'Ground',
  'Silk Scarf': 'Normal',
  'Silver Powder': 'Bug',
  'Sky Plate': 'Flying',
  'Soft Sand': 'Ground',
  'Spell Tag': 'Ghost',
  'Splash Plate': 'Water',
  'Spooky Plate': 'Ghost',
  'Steel Memory': 'Steel',
  'Stone Plate': 'Rock',
  'Tanga Berry': 'Bug',
  'Toxic Plate': 'Poison',
  'Twisted Spoon': 'Psychic',
  'Wacan Berry': 'Electric',
  'Water Memory': 'Water',
  'Wave Incense': 'Water',
  'Yache Berry': 'Ice',
  'Zap Plate': 'Electric',
} as Record<ItemName, Showdown.TypeName>;
