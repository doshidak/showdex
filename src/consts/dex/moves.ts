import { type AbilityName, type ItemName, type MoveName } from '@smogon/calc';
import { PokemonMoveSkinAbilities } from './abilities';

/**
 * Z moves by type.
 *
 * @since 0.1.2
 */
export const PokemonZMoves: Record<Showdown.TypeName, MoveName> = {
  '???': null,
  Poison: 'Acid Downpour',
  Fighting: 'All-Out Pummeling',
  Dark: 'Black Hole Eclipse',
  Grass: 'Bloom Doom',
  Normal: 'Breakneck Blitz',
  Rock: 'Continental Crush',
  Steel: 'Corkscrew Crash',
  Dragon: 'Devastating Drake',
  Electric: 'Gigavolt Havoc',
  Water: 'Hydro Vortex',
  Fire: 'Inferno Overdrive',
  Ghost: 'Never-Ending Nightmare',
  Bug: 'Savage Spin-Out',
  Psychic: 'Shattered Psyche',
  Ice: 'Subzero Slammer',
  Flying: 'Supersonic Skystrike',
  Ground: 'Tectonic Rage',
  Fairy: 'Twinkle Tackle',
} as Record<Showdown.TypeName, MoveName>;

/**
 * Special Z moves by pre-Z move, then by Z Crystal.
 *
 * @since 1.0.3
 */
export const PokemonSpecialZMoves: Record<MoveName, Record<ItemName, MoveName>> = {
  'Clanging Scales': {
    'Kommonium Z': 'Clangorous Soulblaze',
  },
  'Darkest Lariat': {
    'Incinium Z': 'Malicious Moonsault',
  },
  'Giga Impact': {
    'Snorlium Z': 'Pulverizing Pancake',
  },
  'Moongeist Beam': {
    'Lunalium Z': 'Menacing Moonraze Maelstrom',
  },
  "Nature's Madness": {
    'Tapunium Z': 'Guardian of Alola',
  },
  'Photon Geyser': {
    'Ultranecrozium Z': 'Light That Burns the Sky',
  },
  'Play Rough': {
    'Mimikium Z': "Let's Snuggle Forever",
  },
  Psychic: {
    'Mewnium Z': 'Genesis Supernova',
  },
  'Sparkling Aria': {
    'Primarium Z': 'Oceanic Operetta',
  },
  'Spectral Thief': {
    'Marshadium Z': 'Soul-Stealing 7-Star Strike',
  },
  'Spirit Shackle': {
    'Decidium Z': 'Sinister Arrow Raid',
  },
  'Stone Edge': {
    'Lycanium Z': 'Splintered Stormshards',
  },
  'Sunsteel Strike': {
    'Solganium Z': 'Searing Sunraze Smash',
  },
  Thunderbolt: {
    'Aloraichium Z': 'Stoked Sparksurfer',
    'Pikashunium Z': '10,000,000 Volt Thunderbolt',
  },
  'Volt Tackle': {
    'Pikanium Z': 'Catastropika',
  },
} as Record<MoveName, Record<ItemName, MoveName>>;

/**
 * Dynamax moves by type.
 *
 * @since 0.1.2
 */
export const PokemonDmaxMoves: Record<Showdown.TypeName, MoveName> = {
  '???': null,
  Flying: 'Max Airstream',
  Dark: 'Max Darkness',
  Fire: 'Max Flare',
  Bug: 'Max Flutterby',
  Water: 'Max Geyser',
  Ice: 'Max Hailstorm',
  Fighting: 'Max Knuckle',
  Electric: 'Max Lightning',
  Psychic: 'Max Mindstorm',
  Poison: 'Max Ooze',
  Grass: 'Max Overgrowth',
  Ghost: 'Max Phantasm',
  Ground: 'Max Quake',
  Rock: 'Max Rockfall',
  Fairy: 'Max Starfall',
  Steel: 'Max Steelspike',
  Normal: 'Max Strike',
  Dragon: 'Max Wyrmwind',
} as Record<Showdown.TypeName, MoveName>;

/**
 * Dynamax moves by abilities that override the moves' types.
 *
 * @since 1.0.3
 */
export const PokemonDmaxAbilityMoves: Record<AbilityName, MoveName> = {
  // this is what the `Object.entries(PokemonMoveSkinAbilities)` bit below will do:
  // Aerilate: PokemonDmaxMoves.Flying,
  // Galvanize: PokemonDmaxMoves.Electric,
  // Normalize: PokemonDmaxMoves.Normal,
  // Pixilate: PokemonDmaxMoves.Fairy,
  // Refrigerate: PokemonDmaxMoves.Ice,

  ...(Object.entries(PokemonMoveSkinAbilities) as [AbilityName, Showdown.TypeName][])
    .reduce((
      prev,
      [ability, type],
    ) => {
      if (!PokemonDmaxMoves[type]) {
        return prev;
      }

      prev[ability] = PokemonDmaxMoves[type];

      return prev;
    }, {} as Record<AbilityName, MoveName>),
} as Record<AbilityName, MoveName>;

/**
 * Gigantamax moves by type, then by species forme.
 *
 * * Species formes should **not** include the `'-Gmax'` suffix.
 *
 * @since 1.0.3
 */
export const PokemonGmaxMoves: Record<Showdown.TypeName, Record<string, MoveName>> = {
  // '???': null,
  // Bug: null,
  Dark: {
    Grimmsnarl: 'G-Max Snooze',
    Urshifu: 'G-Max One Blow',
  },
  Dragon: {
    Duraludon: 'G-Max Depletion',
  },
  Electric: {
    Pikachu: 'G-Max Volt Crash',
    Toxtricity: 'G-Max Stun Shock',
  },
  Fairy: {
    Alcremie: 'G-Max Finale',
    Hatterene: 'G-Max Smite',
  },
  Fighting: {
    Machamp: 'G-Max Chi Strike',
  },
  Fire: {
    Centiskorch: 'G-Max Centiferno',
    Charizard: 'G-Max Wildfire',
    Cinderace: 'G-Max Fireball',
  },
  Flying: {
    Corviknight: 'G-Max Wind Rage',
  },
  Ghost: {
    Gengar: 'G-Max Terror',
  },
  Grass: {
    Appletun: 'G-Max Sweetness',
    Flapple: 'G-Max Tartness',
    Rillaboom: 'G-Max Drum Solo',
    Venusaur: 'G-Max Vine Lash',
  },
  Ground: {
    Sandaconda: 'G-Max Sandblast',
  },
  Ice: {
    Lapras: 'G-Max Resonance',
  },
  Normal: {
    Eevee: 'G-Max Cuddle',
    Meowth: 'G-Max Gold Rush',
    Snorlax: 'G-Max Replenish',
  },
  Poison: {
    Garbodor: 'G-Max Malodor',
  },
  Psychic: {
    Orbeetle: 'G-Max Gravitas',
  },
  Rock: {
    Coalossal: 'G-Max Volcalith',
  },
  Steel: {
    Copperajah: 'G-Max Steelsurge',
    Melmetal: 'G-Max Meltdown',
  },
  // Stellar: null,
  Water: {
    Blastoise: 'G-Max Cannonade',
    Drednaw: 'G-Max Stonesurge',
    Inteleon: 'G-Max Hydrosnipe',
    Kingler: 'G-Max Foam Burst',
    'Urshifu-Rapid-Strike': 'G-Max Rapid Flow',
  },
} as unknown as Record<Showdown.TypeName, Record<string, MoveName>>;

/**
 * Moves that always critical hit.
 *
 * @see https://github.com/pkmn/ps/blob/bce04b4900d33386391162412cc4409442c6791d/dex/data/moves.json
 * @see https://bulbapedia.bulbagarden.net/wiki/Category:Moves_with_a_perfect_critical_hit_chance
 * @since 1.0.3
 */
export const PokemonCriticalHitMoves: MoveName[] = [
  'Flower Trick',
  'Frost Breath',
  'Storm Throw',
  'Surging Strikes',
  'Wicked Blow',
  'Zippy Zap',
] as MoveName[];

/**
 * Moves that allow the target Pokemon to switch.
 *
 * * Primarily used in `mergeRevealedMoves()` for replacing existing damaging STAB moves,
 *   except for these pivot moves!
 *
 * @since 1.0.7
 */
export const PokemonPivotMoves: MoveName[] = [
  'Baton Pass',
  'Flip Turn',
  'Parting Shot',
  'Shed Tail', // gen 9 :o
  'Teleport',
  'U-turn',
  'Volt Switch',
] as MoveName[];

/**
 * Moves with effects that can be toggled.
 *
 * * Primarily used in `detectToggledMove()` for determining whether a move's effect can be & is currently toggled.
 * * Note that there isn't a "catch-all" kind of implementation here; any moves listed here will need to be
 *   specifically handled wherever their effects may apply.
 *
 * @since 1.1.6
 */
export const PokemonToggleMoves: MoveName[] = [
  'Power Trick',
] as MoveName[];

/**
 * Moves that cannot be affected by the *Normalize* ability, which turns every move, including Status moves, into a
 * Normal type move.
 *
 * * Note that in gen 4, the gen *Normalize* was introduced, these moves **are** affected by it.
 *   - In other words, you shouldn't be using this list in gen 4 since a move like *Hidden Power Fire* will become Normal.
 *   - You should check the gen first to make sure it's at least gen 5 before using this as an ignore list.
 * * Starting in gens 5+, these moves are **no longer** affected by it.
 *   - From the previous example, *Hidden Power Fire* will retain its Fire type, no longer becoming Normal like before.
 * * This list does **not** include Z moves, which are **not** affected by it (i.e., should be in this list, but it ain't).
 *   - While we do have all possible Z moves hardcoded where this list is defined, I'm too lazy to make it into a nice
 *     array so just do a `dex.moves.get()` lookup & check the falsiness of the resulting `isZ` to pass this filter.
 * * This list includes *Hidden Power*, but it doesn't include specific typed versions like *Hidden Power Fire*.
 *   - Be wary that using `includes()` on this list will fail for typed *Hidden Power* moves, e.g.,
 *     `PokemonDenormalizedMoves.includes('Hidden Power Fire')` produces `false`.
 *   - In addition to the aforementioned gen 4 check, you should also do a partial string match for `'Hidden Power'`
 *     using `moveName.startsWith()`.
 *   - e.g., `'Hidden Power Fire'.startsWith('Hidden Power')` produces `true`.
 *
 * @since 1.2.0
 */
export const PokemonDenormalizedMoves: MoveName[] = [
  'Hidden Power', // gens 5+ (warning: does not check typed Hidden Power's !!)
  'Judgment', // gens 5+
  'Multi-Attack', // gens 7+
  'Natural Gift', // gens 5+
  'Techno Blast', // gens 5+
  'Terrain Pulse', // gens 7+
  'Weather Ball', // gens 5+
  // note: Z moves are supposed to be in this list, but I'm too lazy to programmatically construct it rn lmao
] as MoveName[];
