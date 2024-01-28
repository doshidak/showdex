import { eacute, times } from '@showdex/consts/core';

/**
 * Kinda-standardized dictionary of genless format labels based on how Showdown formats them.
 *
 * * Used to be all abbreviations, but since v0.1.3, these are now spelled out for less-common formats, like `'AG'`
 *   (Anything Goes) & `'BH'` (Balanced Hackmons).
 *
 * @since 0.1.0
 */
export const FormatLabels: Record<string, string> = {
  '1v1': '1v1',
  '2v2doubles': '2v2 Doubles',
  '350cup': '350 Cup',
  '3v3singles': '3v3 Singles',
  '4v4doublesdraft': '4v4 Doubles Draft',
  '6v6doublesdraft': '6v6 Doubles Draft',
  almostanyability: 'AAA',
  alternatium: 'Alternatium',
  anythinggoes: 'AG',
  balancedhackmons: 'BH',
  battlefactory: 'B-Factory',
  battlefestival: 'B-Fest',
  battlefestivaldoubles: 'B-Fest Doubles',
  battlespot: 'B-Spot',
  battlespotsingles: 'B-Spot Singles',
  battlespotdoubles: 'B-Spot Doubles',
  battlespottriples: 'B-Spot Triples',
  battlestadiumsingles: 'BSS',
  battlestadiumdoubles: 'BSD',
  bdsp3v3singles: 'BDSP 3v3 Singles',
  bdspbattlefestivaldoubles: 'BDSP B-Fest Doubles',
  bdspcap: 'BDSP CAP',
  bdspdoublesou: 'BDSP Doubles OU',
  bdspdraft: 'BDSP Draft',
  bdspmonotype: 'BDSP Monotype',
  bdspnu: 'BDSP NU',
  bdspou: 'BDSP OU', // BrilliantDiamondShiningPearl
  bdsppurehackmons: 'BDSP Pure Hackmons',
  bdsprandombattle: 'BDSP Randoms',
  bdspru: 'BDSP RU',
  bdspubers: 'BDSP Ubers',
  bdspuu: 'BDSP UU',
  blueberryprologue: 'Blueberry Prologue',
  bonustype: 'Bonus Type',
  brokencup: 'Broken Cup',
  bss: 'BSS',
  bssfactory: 'BSS Factory',
  camomons: 'Camomons',
  cap: 'CAP', // CreateAPokemon (no cap, always factual)
  cap1v1: 'CAP 1v1',
  caplc: 'CAP LC',
  challengecup: 'Challenge Cup',
  challengecup1v1: 'Challenge Cup 1v1',
  challengecup2v2: 'Challenge Cup 2v2',
  challengecup6v6: 'Challenge Cup 6v6',
  chimera1v1: 'Chimera 1v1',
  computergeneratedteams: 'CG Teams',
  convergence: 'Convergence',
  crossevolution: 'Cross Evo',
  customgame: 'Customs',
  doublescustomgame: 'Doubles Customs',
  doubleshackmonscup: 'Doubles Hackmons Cup',
  doubleslc: 'Doubles LC',
  doublesnu: 'Doubles NU',
  doublesou: 'Doubles OU',
  doublesubers: 'Doubles Ubers',
  doublesuu: 'Doubles UU',
  draft: 'Draft',
  dragonkingcup: 'Dragon King Cup',
  dreamworldou: 'Dream World OU',
  firstbloodrandombattle: 'First Blood Randoms',
  flipped: 'Flipped',
  forceofthefallen: 'Force of the Fallen',
  fortemons: 'Fortemons',
  franticfusions: 'Frantic Fusions',
  freeforall: 'FFA',
  freeforallrandombattle: 'FFA Randoms',
  fullpotential: 'Full Potential',
  galardexdraft: 'Galar Draft',
  gbusingles: 'GBU Singles',
  godlygift: 'Godly Gift',
  hackmonscup: 'Hackmons Cup',
  hoenngaiden: 'Hoenn Gaiden',
  inheritance: 'Inheritance',
  japaneseou: 'Japanese OU',
  joltemonsrandombattle: 'JolteMons Randoms',
  kitakamiprologue: 'Kitakami Prologue',
  lc: 'LC', // LittleCup
  lcuu: 'LC UU',
  letsgodoublesou: 'LGPE Doubles OU',
  letsgoou: 'LGPE OU', // LetsGoPikachuEevee
  letsgorandombattle: 'LGPE Randoms',
  linked: 'Linked',
  metronomebattle: 'Metronome',
  mixandmega: 'Mix & Mega',
  moderngen1: 'Modern RBY',
  moderngen2: 'Modern GSC',
  monothreatbug: 'Monothreat Bug',
  monothreatdark: 'Monothreat Dark',
  monothreatdragon: 'Monothreat Dragon',
  monothreatelectric: 'Monothreat Electric',
  monothreatfairy: 'Monothreat Fairy',
  monothreatfighting: 'Monothreat Fighting',
  monothreatfire: 'Monothreat Fire',
  monothreatflying: 'Monothreat Flying',
  monothreatghost: 'Monothreat Ghost',
  monothreatgrass: 'Monothreat Grass',
  monothreatground: 'Monothreat Ground',
  monothreatice: 'Monothreat Ice',
  monothreatnormal: 'Monothreat Normal',
  monothreatpoison: 'Monothreat Poison',
  monothreatpsychic: 'Monothreat Psychic',
  monothreatrock: 'Monothreat Rock',
  monothreatsteel: 'Monothreat Steel',
  monothreatwater: 'Monothreat Water',
  monotype: 'Monotype',
  monotypebattlefactory: 'B-Factory Monotype',
  monotypecap: 'CAP Monotype',
  monotypelc: 'LC Monotype',
  monotyperandombattle: 'Monotype Randoms',
  multibility: 'Multibility',
  multirandombattle: 'Multi Randoms',
  natdex4v4doublesdraft: 'NatDex 4v4 Dbl Draft',
  natdex6v6doublesdraft: 'NatDex 6v6 Dbl Draft',
  natdexdraft: 'NatDex Draft', // update (2023/01/06): think it's 'natdex' and not 'nationaldex' here
  natdexlcdraft: 'NatDex LC Draft',
  nationaldex: 'NatDex',
  nationaldexag: 'NatDex AG',
  nationaldexdoubles: 'NatDex Doubles',
  nationaldexbh: 'NatDex BH',
  nationaldexlegacy: 'NatDex Legacy',
  nationaldexmonotype: 'NatDex Monotype',
  nationaldexru: 'NatDex RU',
  nationaldexubers: 'NatDex Ubers',
  nationaldexuu: 'NatDex UU',
  natureswap: 'Nature Swap',
  nextou: 'Next OU',
  nfe: 'NFE', // NotFullyEvolved
  nc1997: 'Nintendo Cup 1997',
  nc1998: 'Nintendo Cup 1998',
  nc1999: 'Nintendo Cup 1999',
  nc2000: 'Nintendo Cup 2000',
  nintendocup1997: 'Nintendo Cup 1997',
  nintendocup1998: 'Nintendo Cup 1998',
  nintendocup1999: 'Nintendo Cup 1999',
  nintendocup2000: 'Nintendo Cup 2000',
  nu: 'NU', // NeverUsed
  ou: 'OU', // OverUsed
  oublitz: 'OU Blitz',
  paldeadexdraft: 'Paldea Draft',
  partnersincrime: 'PiC',
  partnersincrimerandombattle: 'PiC Randoms',
  petitcup: 'Petit Cup',
  pickyourteamrandombattle: 'PYT Randoms', // pretty young thing?
  pikacup: 'Pika Cup',
  pokebilities: `Pok${eacute}bilities`,
  pokebilitiesaaa: `Pok${eacute}bilities AAA`,
  pokecup: `Pok${eacute} Cup`,
  proteanpalace: 'Protean Palace',
  pu: 'PU', // PU (as in, "P-U, smells like ass"... I think)
  purehackmons: 'Pure Hackmons',
  randombattle: 'Randoms',
  randombattleblitz: 'Randoms Blitz',
  randombattlemayhem: 'Randoms Mayhem',
  randombattlenodmax: 'No-Dmax Randoms',
  randombattlepotd: 'PotD Randoms', // Pokemon of the Day
  randomdex: 'Dex Randoms',
  randomdoublesbattle: 'Doubles Randoms',
  randomroulette: 'Randoms Roulette',
  revelationmons: 'Revelationmons',
  ru: 'RU', // RarelyUsed
  sharedpower: 'Shared Power',
  sharedpowerrandombattle: 'Shared Power Randoms',
  sharingiscaring: 'Sharing is Caring',
  sketchmons: 'Sketchmons',
  spikemuthcup: 'Spikemuth Cup',
  stabmons: 'STABmons', // SameTypeAttackBonus
  stabmonsmixandmega: 'STABmons Mix & Mega',
  stadiumou: 'Stadium OU',
  superstaffbros4: 'SSB4',
  tagteamsingles: 'Tag Team Singles',
  teradonation: 'Tera Donation',
  terapreviewdraft: 'Tera Draft',
  terapreviewnatdexdraft: 'NatDex Tera Draft',
  terapreviewpaldeadexdraft: 'Paldea Tera Draft',
  thecardgame: 'Card Game',
  thelosersgame: 'Loser\'s Game',
  tiershift: 'Tier Shift',
  tradebacksou: 'Tradebacks OU',
  trademarked: 'Trademarked',
  trickmagic: 'Trick Magic',
  triplescustomgame: 'Triples Customs',
  ubers: 'Ubers',
  ubersuu: 'Ubers UU',
  ultimatefinale: 'Ultimate Finale',
  unknown: '???',
  uu: 'UU', // UnderUsed
  vaporemons: 'VaporeMons',
  vgc2009: 'VGC 2009', // VideoGameChampionships
  vgc2010: 'VGC 2010',
  vgc2011: 'VGC 2011',
  vgc2012: 'VGC 2012',
  vgc2013: 'VGC 2013',
  vgc2014: 'VGC 2014',
  vgc2015: 'VGC 2015',
  vgc2016: 'VGC 2016',
  vgc2017: 'VGC 2017',
  vgc2018: 'VGC 2018',
  vgc2019: 'VGC 2019',
  vgc2020: 'VGC 2020',
  vgc2021: 'VGC 2021',
  vgc2022: 'VGC 2022',
  vgc2023: 'VGC 2023',
  vgc2024: 'VGC 2024',
  voltturnmayhem: 'Volt Turn Mayhem',
  zu: 'ZU', // ZeroUsed
};

/**
 * Format suffixes & how to parse them.
 *
 * * hehe
 *
 * @since 1.1.7
 */
export const FormatSuffixes: [test: RegExp, replacement: string][] = [
  [/blitz/, 'Blitz'],
  [/legacy/, 'Legacy'],
  [/prehome/, 'Pre-Home'],
  [/unrated/, 'Unrated'],
  [/^dlc(\d)/, 'DLC $1'],
  [/series(\d+)/, 'Series $1'],
  [/reg([a-z])(?!lation)/, 'Reg $1'],
  [/regulation([a-z])/, 'Reg $1'],
  [/muk$/, `${times} Muk`], // saw a "[Gen 2] UU (+ Muk)" lol
  [/bo(\d+)$/, 'Bo$1'],
];

/**
 * Matchers that match Doubles formats.
 *
 * * This also includes any Triples since `@smogon/calc` doesn't support a `GameType` of `'Triples'`... yet o_O ?
 * * Originally hardcoded in `detectDoublesFormat()`, now moved here in v1.2.1.
 *
 * @since 1.2.0
 */
export const DoublesFormatMatchers: RegExp[] = [
  /doubles/,
  /freeforall/,
  /partnersincrime/,
  /triples/,
  /vgc\d{2,4}/,
];

/**
 * Dictionary of kinda-standardized format section names from Showdown's `BattleFormats` global.
 *
 * * Keys are formatted as IDs, so section names should be formatted prior before performing a lookup.
 * * Not an exhasutive list & only includes those that must be matched entirely.
 * * Partial matched section names like `'Past Generations'` & `'Past Gens Doubles OU'` should be handled separately.
 * * This is primarily used by `buildFormatOptions()` for building out the dropdown group option labels.
 *
 * @since 1.2.0
 */
export const FormatSectionLabels: Record<string, string> = {
  nationaldex: 'NatDex',
  omofthemonth: 'Featured OMs',
  othermetagames: 'OMs',
  randomizedformatspotlight: 'Featured Randoms',
  randomizedmetas: 'OM Randoms',
  roaspotlight: 'Featured RoA', // Ruins of Alph (aka. old gens)
  unofficialmetagames: 'UMs',
};

/**
 * Format-to-slug dictionary for accessing the Pokemon's Smogon StrategyDex page specific to the format.
 *
 * @since 0.1.2
 */
export const SmogonDexFormatSlugs: Record<string, string> = {
  '1v1': '1v1',
  '2v2doubles': '2v2-doubles',
  almostanyability: 'almost-any-ability',
  anythinggoes: 'ag',
  balancedhackmons: 'bh',
  battlespotsingles: 'battle-spot-singles',
  battlespotdoubles: 'battle-spot-doubles',
  battlespottriples: 'battle-spot-triples',
  battlestadiumsingles: 'battle-stadium-singles',
  battlestadiumsinglesseries1: 'bss-series-1',
  battlestadiumsinglesseries2: 'bss-series-2',
  battlestadiumsinglesseries12: 'bss-series-12',
  battlestadiumsinglesseries13: 'bss-series-13',
  bdspou: 'bdsp-ou',
  camomons: 'camomons',
  cap: 'cap',
  doubles: 'doubles', // fallback case for formats matching 'doubles'
  doublesou: 'doubles',
  dreamworldou: 'dw-ou',
  godlygift: 'godly-gift',
  letsgoou: 'lgpe-ou',
  mixandmega: 'mix-and-mega',
  monotype: 'monotype', // fallback case for formats matching 'monotype'
  nationaldex: 'national-dex',
  nationaldexag: 'national-dex-ag',
  nationaldexmonotype: 'national-dex-monotype',
  nationaldexru: 'national-dex-ru',
  nationaldexuu: 'national-dex-uu',
  nfe: 'nfe',
  nc1997: 'nintendo-cup-1997',
  nc1998: 'nintendo-cup-1998',
  nc1999: 'nintendo-cup-1999',
  nc2000: 'nintendo-cup-2000',
  nintendocup1997: 'nintendo-cup-1997',
  nintendocup1998: 'nintendo-cup-1998',
  nintendocup1999: 'nintendo-cup-1999',
  nintendocup2000: 'nintendo-cup-2000',
  nu: 'nu',
  ou: 'ou',
  partnersincrime: 'pic',
  petitcup: 'petit-cup',
  pikacup: 'pika-cup',
  pokecup: 'poke-cup-rentals',
  pu: 'pu',
  purehackmons: 'pure-hackmons',
  ru: 'ru',
  stabmons: 'stabmons',
  stadiumou: 'stadium-ou',
  tradebacksou: 'tradebacks-ou',
  ubers: 'uber',
  uu: 'uu',
  vgc2010: 'vgc10',
  vgc2011: 'vgc11',
  vgc2012: 'vgc12',
  vgc2013: 'vgc13',
  vgc2014: 'vgc14',
  vgc2015: 'vgc15',
  vgc2016: 'vgc16',
  vgc2017: 'vgc17',
  vgc2018: 'vgc18',
  vgc2019: 'vgc19',
  vgc2020: 'vgc20',
  vgc2021: 'vgc21',
  vgc2022: 'vgc22',
  vgc2023: 'vgc23',
  vgc2023series1: 'vgc23-series-1',
  vgc2023series2: 'vgc23-series-2',
  vgc2023series3: 'vgc23-series-3',
  vgc2023series4: 'vgc23-series-4',
  vgc2023regulatione: 'vgc24-regulation-e',
  vgc2024: 'vgc24',
  vgc2024regf: 'vgc24-regulation-f',
  vgc2024regulationf: 'vgc24-regulation-f',
  vgc2024regg: 'vgc24-regulation-g',
  vgc2024regulationg: 'vgc24-regulation-g',
  zu: 'zu',
};

/**
 * Formats where abilities & moves should be locked to legal values.
 *
 * * Do not use this array directly; instead, use the `legalLockedFormat()` utility since some special
 *   handling is required for some formats.
 *   - ~~As of v1.1.1, any format starting **and** ending with a forward-slash (`/`) will be converted
 *     into a `RegExp` & `test()`'d.~~
 *   - As of v1.2.0, any entry in this array can either be a `string` literal or `RegExp`.
 *   - Otherwise, the format after stripping the `'gen#'` prefix will be tested with `endsWith()`.
 * * Formats not in this array should allow any illegal abilities and moves to be selected.
 *   - However, if no Pokemon legal abilities and/or moves are available,
 *     all abilities and/or moves will be shown, including illegal ones.
 *   - This case would most likely be caused by Pokemon not being present in the `dex`'s generation.
 *   - See `buildAbilityOptions()` and `buildMoveOptions()` for implementation details.
 * * `showAllOptions` of `ShowdexCalcdexSettings` should take precedence over this behavior.
 * * Note that this list is not final & is subject to change in subsequent versions.
 *
 * @since 1.0.1
 */
export const LegalLockedFormats: (string | RegExp)[] = [
  '1v1',
  '2v2doubles',
  /battlefestival/,
  /battlespot/, // e.g., 'battlespotsingles', 'battlespotdoubles'
  /battlestadium/, // e.g., 'battlestadiumsingles', 'battlestadiumdoublesseries13',
  /^bdsp/, // e.g., 'bdspou'
  'computergeneratedteams',
  'doubleslc',
  'doublesou',
  'doublesubers',
  'doublesuu',
  /draft$/, // e.g., '6v6doublesdraft'
  /factory/, // e.g., 'battlefactory', 'bssfactory'
  /lc(?:uu)?$/,
  /^letsgo/, // e.g., 'letsgorandombattle', 'letsgoou'
  /monothreat/,
  /monotype/,
  /natdex/,
  /nationaldex/,
  'nfe',
  'nu',
  /ou(?:blitz)?$/,
  'pu',
  /random/i, // e.g., 'randombattle', 'unratedrandombattle', 'randombattleblitz'
  'ru',
  /ubers(?:uu)?$/,
  'uu',
  /^vgc/, // e.g., 'vgc2022', 'vgc2023series1'
  'zu',
];

/**
 * Sort ordering of format labels, typically used to order groups of presets.
 *
 * * List will be referred to after sorting formats relative to the current one in `sortPresetGroupsByFormat()`.
 * * Higher the format (i.e., lower index in this array), the higher it will appear.
 * * Each value will be partially matched, but only at the beginning & end of the current format.
 *   - This is to prevent erroneous matches like the "ou" in "d*ou*bles."
 * * Values can be anything, but recommended to base them off of the values in the aforementioned dictionary.
 *   - Also recommended to format them as IDs, i.e., lowercasing all letters & removing all symbols, including spaces.
 *   - e.g., `'vgc'` is preferred over `'VGC 2024'`.
 *
 * @since 1.2.0
 */
export const FormatSortPriorities: string[] = [
  'ou',
  'uu',
  'ubers',
  'ru',
  'nu',
  'pu',
  'monotype',
  'vgc',
  'battlestadium',
  'battlefactory',
  'battlespot',
  'battlefestival',
  'draft',
  'natdex',
  'lc',
  'nfe',
  'zu',
];
