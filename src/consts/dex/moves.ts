import { type MoveName } from '@smogon/calc';

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
 * * Keys for both the pre-Z move and Z Crystal are formatted as IDs.
 *   - e.g., `'darkestlariat'` instead of `'Darkest Lariat'` and `'inciniumz'` instead of `'Incinium Z'`.
 *
 * @since 1.0.3
 */
export const PokemonSpecialZMoves: Record<string, Record<string, MoveName>> = {
  clangingscales: { kommoniumz: 'Clangorous Soulblaze' as MoveName },
  darkestlariat: { inciniumz: 'Malicious Moonsault' as MoveName },
  gigaimpact: { snorliumz: 'Pulverizing Pancake' as MoveName },
  moongeistbeam: { lunaliumz: 'Menacing Moonraze Maelstrom' as MoveName },
  naturesmadness: { tapuniumz: 'Guardian of Alola' as MoveName },
  photongeyser: { ultranecroziumz: 'Light That Burns the Sky' as MoveName },
  playrough: { mimikiumz: "Let's Snuggle Forever" as MoveName },
  psychic: { mewniumz: 'Genesis Supernova' as MoveName },
  sparklingaria: { primariumz: 'Oceanic Operetta' as MoveName },
  spectralthief: { marshadiumz: 'Soul-Stealing 7-Star Strike' as MoveName },
  spiritshackle: { decidiumz: 'Sinister Arrow Raid' as MoveName },
  stoneedge: { lycaniumz: 'Splintered Stormshards' as MoveName },
  sunsteelstrike: { solganiumz: 'Searing Sunraze Smash' as MoveName },
  thunderbolt: {
    aloraichiumz: 'Stoked Sparksurfer' as MoveName,
    pikashuniumz: '10,000,000 Volt Thunderbolt' as MoveName,
  },
  volttackle: { pikaniumz: 'Catastropika' as MoveName },
};

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
    grimmsnarl: 'G-Max Snooze' as MoveName,
    urshifu: 'G-Max One Blow' as MoveName,
  },
  Dragon: { duraludon: 'G-Max Depletion' as MoveName },
  Electric: {
    pikachu: 'G-Max Volt Crash' as MoveName,
    toxtricity: 'G-Max Stun Shock' as MoveName,
  },
  Fairy: {
    alcremie: 'G-Max Finale' as MoveName,
    hatterene: 'G-Max Smite' as MoveName,
  },
  Fighting: { machamp: 'G-Max Chi Strike' as MoveName },
  Fire: {
    centiskorch: 'G-Max Centiferno' as MoveName,
    charizard: 'G-Max Wildfire' as MoveName,
    cinderace: 'G-Max Fireball' as MoveName,
  },
  Flying: { corviknight: 'G-Max Wind Rage' as MoveName },
  Ghost: { gengar: 'G-Max Terror' as MoveName },
  Grass: {
    appletun: 'G-Max Sweetness' as MoveName,
    flapple: 'G-Max Tartness' as MoveName,
    rillaboom: 'G-Max Drum Solo' as MoveName,
    venusaur: 'G-Max Vine Lash' as MoveName,
  },
  Ground: { sandaconda: 'G-Max Sandblast' as MoveName },
  Ice: { lapras: 'G-Max Resonance' as MoveName },
  Normal: {
    eevee: 'G-Max Cuddle' as MoveName,
    meowth: 'G-Max Gold Rush' as MoveName,
    snorlax: 'G-Max Replenish' as MoveName,
  },
  Poison: { garbodor: 'G-Max Malodor' as MoveName },
  Psychic: { orbeetle: 'G-Max Gravitas' as MoveName },
  Rock: { coalossal: 'G-Max Volcalith' as MoveName },
  Steel: {
    copperajah: 'G-Max Steelsurge' as MoveName,
    melmetal: 'G-Max Meltdown' as MoveName,
  },
  Water: {
    blastoise: 'G-Max Cannonade' as MoveName,
    drednaw: 'G-Max Stonesurge' as MoveName,
    inteleon: 'G-Max Hydrosnipe' as MoveName,
    kingler: 'G-Max Foam Burst' as MoveName,
    urshifurapidstrike: 'G-Max Rapid Flow' as MoveName,
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
