import { eacute } from '@showdex/consts/core';

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
 * * As of v1.1.2, this has been renamed to `PokemonPresetFuckedFormes` from `PokemonUsageFuckedFormes` to better
 *   reflect what this is used for.
 *   - Primarily only used by the `getPresetFormes()` utility.
 *
 * @since 1.0.5
 */
export const PokemonPresetFuckedFormes: string[] = [
  'Basculin', // -> Basculin-Blue-Striped -> Basculin-White-Striped
  // 'Basculegion', // -> Basculegion-F (technically a Hisuian Pokemon--only available in PLA)
  'Burmy', // -> Burmy-Sandy -> Burmy-Trash
  'Castform', // -> Castform-Rainy -> Castform-Snowy -> Castform-Sunny
  'Cherrim', // -> Cherrim-Sunshine
  'Cramorant', // -> Cramorant-Gorging -> Cramorant-Gulping
  'Darmanitan', // -> Darmanitan-Zen (via battleOnly from dex.species.get())
  'Darmanitan-Galar', // -> Darmanitan-Galar-Zen (via battleOnly from dex.species.get())
  'Deerling', // -> Deerling-Summer -> Deerling-Autumn -> Deerling-Winter
  'Dudunsparce', // -> Dudunsparce-Three-Segment -> (it's time to) Dudududududududunsparce-Seven-Segment
  'Eevee', // -> Eevee-Starter
  'Eiscue', // -> Eiscue-Noice
  `Flab${eacute}b${eacute}`, // -> Flabébé-Blue -> Flabébé-Orange -> Flabébé-White -> Flabébé-Yellow (eacutes will be removed by formatId() btw)
  'Floette', // -> Floette-Blue -> Floette-Orange -> Floette-White -> Floette-Yellow
  'Florges', // -> Florges-Blue -> Florges-Orange -> Florges-White -> Florges-Yellow
  'Furfrou', // -> Furfrou-Dandy -> Furfrou-Debutante -> Furfrou-Diamond -> Furfrou-Heart -> Furfrou-Kabuki -> Furfrou-La Reine -> Furfrou-Matron -> Furfrou-Pharaoh -> Furfrou-Star
  // 'Gourgeist', // -> Gourgeist-Large -> Gourgeist-Small -> Gourgeist-Super (other formes have their own sets)
  'Gastrodon', // -> Gastrodon-East
  'Gimmighoul', // -> Gimmighoul-Roaming
  // 'Greninja', // -> Greninja-Ash (other formes have their own sets)
  // 'Indeedee', // -> Indeedee-F (other formes have their own sets)
  'Keldeo', // -> Keldeo-Resolute
  'Magearna', // -> Magearna-Original
  'Maushold', // -> Maushold-Four -> Mau5hold-Dead
  'Meloetta', // -> Meloetta-Pirouette
  'Meowstic', // -> Meowstic-F
  'Mimikyu', // -> Mimikyu-Busted
  'Minior', // -> Minior-Meteor
  'Morpeko', // -> Morpeko-Hangry
  'Necrozma-Dawn-Wings', // -> Necrozma-Ultra (via battleOnly from dex.species.get())
  'Necrozma-Dusk-Mane', // -> Necrozma-Ultra (via battleOnly from dex.species.get())
  // 'Oricorio', // -> Oricorio-Pa'u -> Oricorio-Pom-Pom -> Oricorio-Sensu (other formes have their own sets)
  'Palafin', // -> Palafin-Hero
  'Pikachu', // -> Pikachu-Alola -> Pikachu-Hoenn -> Pikachu-Kalos -> Pikachu-Original -> Pikachu-Partner -> Pikachu-Sinnoh -> Pikachu-Unova -> Pikachu-World -> Pikachu-Starter
  'Polteageist', // -> Polteageist-Antique
  'Sawsbuck', // -> Sawsbuck-Summer -> Sawsbuck-Autumn -> Sawsbuck-Winter
  'Shellos', // -> Shellos-East
  'Sinistea', // -> Sinistea-Antique
  'Squawkabilly', // -> Squawkabilly-Blue -> Squawkabilly-White -> Squawkabilly-Yellow
  'Tatsugiri', // -> (no formes in Showdown yet, but there are a lot of different colored ones in game)
  'Toxtricity', // -> Toxtricity-Low-Key
  'Vivillon', // -> Vivillon-Fancy -> Vivillon-Pokeball
  'Wishiwashi', // -> Wishiwashi-School
  'Xerneas', // -> Xerneas-Neutral
  'Zarude', // -> Zarude-Dada
  'Zygarde', // -> Zygarde-Complete
];
