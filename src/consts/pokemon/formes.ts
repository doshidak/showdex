/**
 * List of Pokemon base formes that are just completely **fucked** in the Showdown Usage stats API.
 *
 * * If the Pokemon's base forme is in this list, perform a partial search of its current forme AND base forme.
 *   - Otherwise, default to performing exact matches of the Pokemon's and preset's `speciesForme` properties.
 * * For example, *Keldeo* and *Keldeo-Resolute* have the same base stats, but only the former exists in the API.
 *   - When the user has *Keldeo-Resolute*, if we performed an exact search, no Showdown Usage stats would be returned.
 * * Also should include cosmetic formes like *Gastrodon* and *Gastrodon-East*.
 * * Top contender for sure is *Pikachu*.
 * * Special thanks to camdawgboi for making this list.
 *   - (Refer all complaints to him.)
 *
 * @since 1.0.5
 */
export const PokemonUsageFuckedFormes: string[] = [
  'Basculegion',
  'Gastrodon',
  'Keldeo',
  'Magearna',
  'Meowstic',
  'Minior',
  'Oricorio',
  'Pikachu',
  'Polteageist',
  'Sinistea',
  'Toxtricity',
  'Vivillon',
  'Zarude',
];
