/**
 * Abbreviations for Showdown battle formats.
 *
 * * Typically only used for distinguishing presets by format.
 * * Attempted to standardize the format names with the following rules:
 *   - Format should not include the generation prefix, e.g., `'gen8'`.
 *     - We're only interested in the format after the prefix, e.g., the `'ou'` in `'gen8ou'`.
 *   - Sub-formats, if any, are separated by hyphens (`-`).
 *   - Primary format should precede sub-formats, e.g., `'gen8bdspou'` should be `'OU-BDSP'` and not `'BDSP-OU'`.
 *     - Seems counterintuitive, but makes it easier to parse through the list of presets, if sorted lexicographically.
 *   - Each abbreviation, whether the primary or sub-format, should be capitalized and not exceed more than 4 characters.
 *     - Only exception is `'XvX'` formats (where `X` is a number), where the `'v'` is lowercased cause aesthetic.
 * * Still a work-in-progress cause I'm unsure how intuitive some of these formats are, like `'AAA'` and `'INHT'`.
 *
 * @since 0.1.0
 */
export const FormatLabels: Record<string, string> = {
  '1v1': '1v1',
  '2v2doubles': '2v2-2X',
  almostanyability: 'AAA',
  alternatium: 'ALT',
  anythinggoes: 'AG',
  balancedhackmons: 'BH',
  battlefactory: 'BF',
  battlespotsingles: 'BSP-1X',
  battlespotdoubles: 'BSP-2X',
  battlestadiumsingles: 'BST-1X',
  battlestadiumdoubles: 'BST-2X',
  bdsp3v3singles: '3v3-1X-BDSP',
  bdspbattlefestivaldoubles: 'BF-2X-BDSP',
  bdspcap: 'CAP-BDSP',
  bdspmonotype: 'MONO-BDSP',
  bdspnu: 'NU-BDSP',
  bdspou: 'OU-BDSP', // BrilliantDiamondShiningPearl
  bdsppurehackmons: 'PH-BDSP',
  bdsprandombattle: 'RNG-BDSP',
  bdspru: 'RU-BDSP',
  bdspubers: 'UBER-BDSP',
  bdspuu: 'UU-BDSP',
  bssfactory: 'BSSF',
  camomons: 'CAMO',
  cap: 'CAP', // CreateAPokemon (no cap, always factual)
  cap1v1: 'CAP-1v1',
  caplc: 'CAP-LC',
  challengecup: 'CC',
  challengecup1v1: 'CC-1v1',
  challengecup2v2: 'CC-2v2',
  crossevolution: 'XEVO',
  customgame: 'CG',
  doublescustomgame: 'CG-2X',
  doubleshackmonscup: 'HC-2X',
  doubleslc: 'LC-2X',
  doublesou: 'OU-2X',
  doublesubers: 'UBER-2X',
  doublesuu: 'UU-2X',
  freeforall: 'FFA',
  freeforallrandombattle: 'RNG-FFA',
  gbusingles: 'GBU-1X',
  godlygift: 'GG',
  hackmonscup: 'HC',
  inheritance: 'INHT',
  japaneseou: 'OU-JP',
  lc: 'LC', // LittleCup
  lcuu: 'LC-UU',
  letsgoou: 'OU-LGPE', // LetsGoPikachuEevee
  linked: 'LINK',
  metronomebattle: 'MTRN',
  mixandmega: 'M&M',
  monotype: 'MONO',
  monotypebattlefactory: 'BF-MONO',
  monotyperandombattle: 'RNG-MONO',
  multibility: 'MBIL',
  multirandombattle: 'RNG-MULT',
  nationaldex: 'NDEX',
  nationaldexag: 'NDEX-AG',
  nationaldexmonotype: 'NDEX-MONO',
  natureswap: 'NS',
  nextou: 'OU-NEXT',
  nfe: 'NFE', // NotFullyEvolved
  nintendocup1997: 'NC-97',
  nintendocup2000: 'NC-00',
  nu: 'NU', // NeverUsed
  ou: 'OU', // OverUsed
  oublitz: 'OU-BZ', // went w/ BZ for Blitz cause BL = BanList! (like in PUBL, UUBL, etc.)
  pokebilities: 'PBIL',
  pu: 'PU', // PU (as in, "P-U, smells like ass"... I think)
  purehackmons: 'PH',
  randombattle: 'RNG', // thought about RB, but that sounds like Arby's and not Random Battles lmao
  randombattleblitz: 'RNG-BZ',
  randombattlemayhem: 'RNG-MH',
  randombattlenodmax: 'RNG-NODM',
  randomdex: 'RNG-DEX',
  randomdoublesbattle: 'RNG-2X',
  ru: 'RU', // RarelyUsed
  sharedpower: 'SPWR',
  stabmons: 'STAB', // SameTypeAttackBonus
  stadiumou: 'OU-ST',
  superstaffbros4: 'SSB-4',
  thelosersgame: 'TLG',
  tradebacksou: 'OU-TB',
  triplescustomgame: 'CG-3X',
  ubers: 'UBER',
  unratedrandombattle: 'RNG-UR',
  uu: 'UU', // UnderUsed
  vgc2009: 'VGC-09', // VideoGameChampionships
  vgc2010: 'VGC-10',
  vgc2011: 'VGC-11',
  vgc2012: 'VGC-12',
  vgc2013: 'VGC-13',
  vgc2014: 'VGC-14',
  vgc2015: 'VGC-15',
  vgc2016: 'VGC-16',
  vgc2017: 'VGC-17',
  vgc2018: 'VGC-18',
  vgc2019: 'VGC-19',
  vgc2020: 'VGC-20',
  vgc2021: 'VGC-21',
  vgc2022: 'VGC-22',
  zu: 'ZU', // ZeroUsed
};
