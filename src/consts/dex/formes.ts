import { eacute } from '@showdex/consts/core';

/**
 * List of Pokemon base formes with alternate formes that are just completely **fucked** in any preset API.
 *
 * * And by *completely fucked*, I mean nonexistent, e.g., you won't find a set for a *Mimikyu-Busted*.
 * * If the Pokemon's base forme is in this list, perform a partial search of its current forme AND base forme.
 *   - Otherwise, default to performing exact matches of the Pokemon's and preset's `speciesForme` properties.
 * * For example, *Keldeo* and *Keldeo-Resolute* have the same base stats, but only the former exists in the API.
 *   - When the user has *Keldeo-Resolute*, if we performed an exact search, no Showdown Usage stats would be returned.
 * * Also should include cosmetic formes like *Gastrodon* and *Gastrodon-East*.
 * * Top contender for sure is *Pikachu*.
 * * Special thanks to camdawgboi for making this list.
 *   - (Refer all complaints to him.)
 * * ~~As of v1.1.2, this has been renamed to `PokemonPresetFuckedFormes` from `PokemonUsageFuckedFormes` to better
 *   reflect what this is used for.~~
 *   - Primarily only used by the `getPresetFormes()` utility.
 * * As of v1.1.7, this is solely being used as forme aliases for `otherFormes[]` that should be considered to be one of
 *   the `cosmeticFormes[]` (i.e., any base forme in this list will share presets with any of its `otherFormes[]`).
 *   - Also, this has been renamed from `PokemonPresetFuckedFormes` to `PokemonPresetFuckedBaseFormes`.
 *
 * @since 1.0.5
 */
export const PokemonPresetFuckedBaseFormes: string[] = [
  'Basculin', // -> Basculin-Blue-Striped -> Basculin-White-Striped
  // 'Basculegion', // -> Basculegion-F (technically a Hisuian Pokemon--only available in PLA)
  'Burmy', // -> Burmy-Sandy -> Burmy-Trash
  'Castform', // -> Castform-Rainy -> Castform-Snowy -> Castform-Sunny
  'Cherrim', // -> Cherrim-Sunshine
  'Cramorant', // -> Cramorant-Gorging -> Cramorant-Gulping
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
  'Greninja', // -> Greninja-Bond -> Greninja-Ash (update [2023/10/18]: enabling this cause there's no link from Greninja-Bond to Greninja in the Dex, other than baseSpecies)
  // 'Indeedee', // -> Indeedee-F (other formes have their own sets)
  'Keldeo', // -> Keldeo-Resolute
  'Magearna', // -> Magearna-Original
  'Maushold', // -> Maushold-Four -> Mau5hold-Dead
  'Meloetta', // -> Meloetta-Pirouette
  'Meowstic', // -> Meowstic-F
  'Mimikyu', // -> Mimikyu-Busted
  'Morpeko', // -> Morpeko-Hangry
  // 'Oricorio', // -> Oricorio-Pa'u -> Oricorio-Pom-Pom -> Oricorio-Sensu (other formes have their own sets)
  'Palafin', // -> Palafin-Hero
  'Pikachu', // -> Pikachu-Alola -> Pikachu-Hoenn -> Pikachu-Kalos -> Pikachu-Original -> Pikachu-Partner -> Pikachu-Sinnoh -> Pikachu-Unova -> Pikachu-World -> Pikachu-Starter
  'Poltchageist', // -> Poltchageist-Artisan
  'Polteageist', // -> Polteageist-Antique
  'Ribombee', // -> Ribombee-Totem
  'Sawsbuck', // -> Sawsbuck-Summer -> Sawsbuck-Autumn -> Sawsbuck-Winter
  'Shellos', // -> Shellos-East
  'Sinistcha', // -> Sinistcha-Masterpiece
  'Sinistea', // -> Sinistea-Antique
  'Squawkabilly', // -> Squawkabilly-Blue -> Squawkabilly-White -> Squawkabilly-Yellow
  'Tatsugiri', // -> Tatsugiri-Droopy -> Tatsugiri-Stretchy
  'Terapagos', // -> Terapagos-Terastal -> Terapagos-Stellar
  'Toxtricity', // -> Toxtricity-Low-Key
  'Vivillon', // -> Vivillon-Fancy -> Vivillon-Pokeball
  'Wishiwashi', // -> Wishiwashi-School
  'Xerneas', // -> Xerneas-Neutral
  'Zarude', // -> Zarude-Dada
  'Zygarde', // -> Zygarde-Complete
];

/**
 * List of Pokemon alternate formes that are just completely **fucked** in any preset API.
 *
 * * And by *completely fucked*, I mean nonexistent, i.e., you won't find a set for an *Ogerpon-Wellspring-Tera*.
 * * For example, if `'Necrozma-Ultra'` is in this list (which it is), then whenever a Pokemon with the aforementioned
 *   `speciesForme` is detected, its `battleOnly[]` formes of `['Necrozma-Dawn-Wings', 'Necrozma-Dusk-Mane']` will also
 *   be included in the list of formes to match presets against.
 * * That being said, this list should **never** include any base formes!!
 * * You can alternatively think of this as the *opposite* of `PokemonPresetFuckedBaseFormes[]`, where instead of aliasing
 *   all of its alternate formes to its base forme, you specify which alternate formes to alias.
 *   - Though, this isn't entirely accurate since formes here will only include `battleOnly[]` & `changesFrom` formes,
 *     which, if they're not defined (for a lot of Pokemon, they're not; typically `undefined`), won't be included.
 *   - In other words, this would only go down one "level" in the forme "tree," instead of going down to the bottom.
 *   - For instance, one "level" down from *Ogerpon-Wellspring-Tera* would be *Ogerpon-Wellspring*, but the bottom would
 *     be its base forme, just *Ogerpon* (which, as designed, we wouldn't want here!).
 * * To know what Pokemon to add to the list, you probably want to manually run `Dex.species.get()` in the DevTools console
 *   of Pokemon Showdown & check the `battleOnly[]` & `changesFrom` properties of the resulting `Species` object.
 *   - Note: `battleOnly[]` can also be a string, not necessarily an array of strings!
 *   - (Not something to worry about since it'll be properly handled in `getPresetFormes()`, but just letting you know hehe.)
 * * Prior to v1.1.7, this used to be included in `PokemonPresetFuckedFormes[]`, but has been separated to keep logic
 *   more focused (& so I don't get confused about functionality every time I come back to update this once in a while LOL).
 *
 * @since 1.1.7
 */
export const PokemonPresetFuckedBattleFormes: string[] = [
  'Aegislash-Blade', // <- Aegislash (battleOnly)
  'Darmanitan-Galar-Zen', // <- Darmanitan-Galar (battleOnly)
  'Darmanitan-Zen', // <- Darmanitan (battleOnly)
  'Genesect-Burn', // <- Genesect (changesFrom)
  'Genesect-Chill', // <- Genesect (changesFrom)
  'Genesect-Douse', // <- Genesect (changesFrom)
  'Genesect-Shock', // <- Genesect (changesFrom)
  'Minior-Meteor', // <- Minior (battleOnly)
  'Necrozma-Ultra', // <- Necrozma-Dawn-Wings <- Necrozma-Dusk-Mane (battleOnly[])
  'Ogerpon-Teal-Tera', // <- Ogerpon (battleOnly)
  'Ogerpon-Cornerstone-Tera', // <- Ogerpon-Cornerstone (battleOnly)
  'Ogerpon-Hearthflame-Tera', // <- Ogerpon-Hearthflame (battleOnly)
  'Ogerpon-Wellspring-Tera', // <- Ogerpon-Wellspring (battleOnly)
];
