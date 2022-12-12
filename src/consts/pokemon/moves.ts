import type { MoveName } from '@smogon/calc/dist/data/interface';

/**
 * Z moves by type.
 *
 * @since 0.1.2
 */
export const PokemonZMoves: Record<Showdown.TypeName, MoveName> = {
  '???': null,
  Poison: <MoveName> 'Acid Downpour',
  Fighting: <MoveName> 'All-Out Pummeling',
  Dark: <MoveName> 'Black Hole Eclipse',
  Grass: <MoveName> 'Bloom Doom',
  Normal: <MoveName> 'Breakneck Blitz',
  Rock: <MoveName> 'Continental Crush',
  Steel: <MoveName> 'Corkscrew Crash',
  Dragon: <MoveName> 'Devastating Drake',
  Electric: <MoveName> 'Gigavolt Havoc',
  Water: <MoveName> 'Hydro Vortex',
  Fire: <MoveName> 'Inferno Overdrive',
  Ghost: <MoveName> 'Never-Ending Nightmare',
  Bug: <MoveName> 'Savage Spin-Out',
  Psychic: <MoveName> 'Shattered Psyche',
  Ice: <MoveName> 'Subzero Slammer',
  Flying: <MoveName> 'Supersonic Skystrike',
  Ground: <MoveName> 'Tectonic Rage',
  Fairy: <MoveName> 'Twinkle Tackle',
};

/**
 * Special Z moves by pre-Z move, then by Z Crystal.
 *
 * * Keys for both the pre-Z move and Z Crystal are formatted as IDs.
 *   - e.g., `'darkestlariat'` instead of `'Darkest Lariat'` and `'inciniumz'` instead of `'Incinium Z'`.
 *
 * @since 1.0.3
 */
export const PokemonSpecialZMoves: Record<string, Record<string, MoveName>> = {
  clangingscales: { kommoniumz: <MoveName> 'Clangorous Soulblaze' },
  darkestlariat: { inciniumz: <MoveName> 'Malicious Moonsault' },
  gigaimpact: { snorliumz: <MoveName> 'Pulverizing Pancake' },
  moongeistbeam: { lunaliumz: <MoveName> 'Menacing Moonraze Maelstrom' },
  naturesmadness: { tapuniumz: <MoveName> 'Guardian of Alola' },
  photongeyser: { ultranecroziumz: <MoveName> 'Light That Burns the Sky' },
  playrough: { mimikiumz: <MoveName> "Let's Snuggle Forever" },
  psychic: { mewniumz: <MoveName> 'Genesis Supernova' },
  sparklingaria: { primariumz: <MoveName> 'Oceanic Operetta' },
  spectralthief: { marshadiumz: <MoveName> 'Soul-Stealing 7-Star Strike' },
  spiritshackle: { decidiumz: <MoveName> 'Sinister Arrow Raid' },
  stoneedge: { lycaniumz: <MoveName> 'Splintered Stormshards' },
  sunsteelstrike: { solganiumz: <MoveName> 'Searing Sunraze Smash' },
  thunderbolt: {
    aloraichiumz: <MoveName> 'Stoked Sparksurfer',
    pikashuniumz: <MoveName> '10,000,000 Volt Thunderbolt',
  },
  volttackle: { pikaniumz: <MoveName> 'Catastropika' },
};

/**
 * Dynamax moves by type.
 *
 * @since 0.1.2
 */
export const PokemonDmaxMoves: Record<Showdown.TypeName, MoveName> = {
  '???': null,
  Flying: <MoveName> 'Max Airstream',
  Dark: <MoveName> 'Max Darkness',
  Fire: <MoveName> 'Max Flare',
  Bug: <MoveName> 'Max Flutterby',
  Water: <MoveName> 'Max Geyser',
  Ice: <MoveName> 'Max Hailstorm',
  Fighting: <MoveName> 'Max Knuckle',
  Electric: <MoveName> 'Max Lightning',
  Psychic: <MoveName> 'Max Mindstorm',
  Poison: <MoveName> 'Max Ooze',
  Grass: <MoveName> 'Max Overgrowth',
  Ghost: <MoveName> 'Max Phantasm',
  Ground: <MoveName> 'Max Quake',
  Rock: <MoveName> 'Max Rockfall',
  Fairy: <MoveName> 'Max Starfall',
  Steel: <MoveName> 'Max Steelspike',
  Normal: <MoveName> 'Max Strike',
  Dragon: <MoveName> 'Max Wyrmwind',
};

/**
 * Dynamax moves by abilities that override the Normal typing.
 *
 * * Keys for abilities are formatted as IDs.
 *   - e.g., `'pixilate'` instead of `'Pixilate'`.
 *
 * @since 1.0.3
 */
export const PokemonDmaxAbilityMoves: Record<string, MoveName> = {
  aerilate: PokemonDmaxMoves.Flying,
  galvanize: PokemonDmaxMoves.Electric,
  pixilate: PokemonDmaxMoves.Fairy,
  refrigerate: PokemonDmaxMoves.Ice,
};

/**
 * Gigantamax moves by type, then by species forme.
 *
 * * Species forme should **not** include the `'-Gmax'` suffix.
 * * Keys for species formes are formatted as IDs.
 *   - e.g., `'grimmsnarl'` instead of `'Grimmsnarl'`.
 *
 * @since 1.0.3
 */
export const PokemonGmaxMoves: Record<Showdown.TypeName, Record<string, MoveName>> = {
  '???': null,
  Bug: null,
  Dark: {
    grimmsnarl: <MoveName> 'G-Max Snooze',
    urshifu: <MoveName> 'G-Max One Blow',
  },
  Dragon: { duraludon: <MoveName> 'G-Max Depletion' },
  Electric: {
    pikachu: <MoveName> 'G-Max Volt Crash',
    toxtricity: <MoveName> 'G-Max Stun Shock',
  },
  Fairy: {
    alcremie: <MoveName> 'G-Max Finale',
    hatterene: <MoveName> 'G-Max Smite',
  },
  Fighting: { machamp: <MoveName> 'G-Max Chi Strike' },
  Fire: {
    centiskorch: <MoveName> 'G-Max Centiferno',
    charizard: <MoveName> 'G-Max Wildfire',
    cinderace: <MoveName> 'G-Max Fire Ball',
  },
  Flying: { corviknight: <MoveName> 'G-Max Wind Rage' },
  Ghost: { gengar: <MoveName> 'G-Max Terror' },
  Grass: {
    appletun: <MoveName> 'G-Max Sweetness',
    flapple: <MoveName> 'G-Max Tartness',
    rillaboom: <MoveName> 'G-Max Drum Solo',
    venusaur: <MoveName> 'G-Max Vine Lash',
  },
  Ground: { sandaconda: <MoveName> 'G-Max Sandblast' },
  Ice: { lapras: <MoveName> 'G-Max Resonance' },
  Normal: {
    eevee: <MoveName> 'G-Max Cuddle',
    meowth: <MoveName> 'G-Max Gold Rush',
    snorlax: <MoveName> 'G-Max Replenish',
  },
  Poison: { garbodor: <MoveName> 'G-Max Malodor' },
  Psychic: { orbeetle: <MoveName> 'G-Max Gravitas' },
  Rock: { coalossal: <MoveName> 'G-Max Volcalith' },
  Steel: {
    copperajah: <MoveName> 'G-Max Steelsurge',
    melmetal: <MoveName> 'G-Max Meltdown',
  },
  Water: {
    blastoise: <MoveName> 'G-Max Cannonade',
    drednaw: <MoveName> 'G-Max Stonesurge',
    inteleon: <MoveName> 'G-Max Hydrosnipe',
    kingler: <MoveName> 'G-Max Foam Burst',
    urshifurapidstrike: <MoveName> 'G-Max Rapid Flow',
  },
};

/**
 * Moves that always critical hit.
 *
 * @see https://github.com/pkmn/ps/blob/bce04b4900d33386391162412cc4409442c6791d/dex/data/moves.json
 * @see https://bulbapedia.bulbagarden.net/wiki/Category:Moves_with_a_perfect_critical_hit_chance
 * @since 1.0.3
 */
export const PokemonCriticalHitMoves: MoveName[] = [
  <MoveName> 'Flower Trick',
  <MoveName> 'Frost Breath',
  <MoveName> 'Storm Throw',
  <MoveName> 'Surging Strikes',
  <MoveName> 'Wicked Blow',
  <MoveName> 'Zippy Zap',
];

/**
 * Moves that allow the target Pokemon to switch.
 *
 * * Primarily used in `mergeRevealedMoves()` for replacing existing damaging STAB moves,
 *   except for these pivot moves!
 *
 * @since 1.0.7
 */
export const PokemonPivotMoves: MoveName[] = [
  <MoveName> 'Baton Pass',
  <MoveName> 'Flip Turn',
  <MoveName> 'Parting Shot',
  <MoveName> 'Shed Tail', // gen 9 :o
  <MoveName> 'Teleport',
  <MoveName> 'U-turn',
  <MoveName> 'Volt Switch',
];
