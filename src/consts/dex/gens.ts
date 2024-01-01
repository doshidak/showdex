import { type GenerationNum } from '@smogon/calc';

/**
 * Label & abbreviation for a given gen.
 *
 * @since 1.2.0
 */
export interface GenerationLabel {
  /**
   * Gen number.
   *
   * @example 9
   * @since 1.2.0
   */
  gen: GenerationNum;

  /**
   * Gen's slug on the Smogon Dex.
   *
   * @example 'sv'
   * @since 1.2.0
   */
  slug: string;

  /**
   * Gen's label, typically its universally recognized abbreviation.
   *
   * * Abbreviations were sourced from the gen segemented control labels in the original Damage Calculator ("calc.ps").
   *
   * @example 'S/V'
   * @since 1.2.0
   */
  label: string;

  /**
   * Gen's optional description, typically a spelled out version of the abbreviations used in the `label`, if any.
   *
   * * These descriptions, if available, should be shown to the user as a tooltip.
   * * May specify secondary & spin-off Pokemon versions of the same `gen` for clarity.
   *   - Abbreviations for these versions were sourced from the "Ruins of Alph" sub-forum labels on Smogon Forums.
   *
   * @example 'Scarlet/Violet'
   * @since 1.2.0
   */
  description?: string;
}

/**
 * List of gen labels, indexed by the gen number.
 *
 * * Note that the first index `0` is invalid & contains a filler label & abbreviation.
 * * Primarily used in `buildGenOptions()` for the out-of-battle Calcdex (aka. "Honkdex") introduced in v1.2.0.
 * * This is also used in `openSmogonDex()` when building the Smogon Dex page URL via the `slug` values.
 *
 * @see https://bulbapedia.bulbagarden.net/wiki/Core_series#List_of_core_series_games
 * @since 1.2.0
 */
export const GenLabels: GenerationLabel[] = [
  {
    gen: null,
    slug: null,
    label: '???',
    description: 'MissingNo.',
  },
  {
    // aka. 'R/G/B[/P]' ("Red/Green/Blue[/Pikachu]" in Japan)
    gen: 1,
    slug: 'rb',
    label: 'RBY',
    description: 'Red/Blue/Yellow + Green (Japan)',
  },
  {
    gen: 2,
    slug: 'gs',
    label: 'GSC',
    description: 'Gold/Silver/Crystal',
  },
  {
    // aka. 'ADV' ("Advance" for Game Boy Advance, the handheld this gen was released for)
    gen: 3,
    slug: 'rs',
    label: 'ADV',
    description: 'Ruby/Sapphire/Emerald (Advance) + FireRed/LeafGreen (FRLG)',
  },
  {
    gen: 4,
    slug: 'dp',
    label: 'DPP',
    description: 'Diamond/Pearl/Platinum + HeartGold/SoulSilver (HGSS)',
  },
  {
    gen: 5,
    slug: 'bw',
    label: 'B/W',
    description: 'Black/White + Black 2/White 2 (B2W2)',
  },
  {
    gen: 6,
    slug: 'xy',
    label: 'X/Y',
    description: 'X/Y + Omega Ruby/Alpha Sapphire (ORAS)',
  },
  {
    gen: 7,
    slug: 'sm',
    label: 'S/M',
    description: 'Sun/Moon + Ultra Sun/Ultra Moon (USUM) + Let\'s Go, Pikachu!/Eevee! (LGPE)',
  },
  {
    gen: 8,
    slug: 'ss',
    label: 'S/S',
    description: 'Sword/Shield + Brilliant Diamond/Shining Pearl (BDSP) + Legends: Arceus (PLA)',
  },
  {
    gen: 9,
    slug: 'sv',
    label: 'S/V',
    description: 'Scarlet/Violet',
  },
];
