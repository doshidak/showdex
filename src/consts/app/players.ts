import { type ShowdexPlayerTitle } from '@showdex/interfaces/app';

/**
 * Special player titles.
 *
 * * Not recommended you access this directly.
 *   - Use `findPlayerTitle()` from `@showdex/utils/app` instead!
 * * Yes, this is hardcoded.
 *
 * @since 1.1.1
 */
export const ShowdexPlayerTitles: ShowdexPlayerTitle[] = [{
  title: 'Verified Showdex Tester',
  supporterId: null,
  custom: false,
  icon: 'flask',
  iconDescription: 'Flask Icon',

  color: {
    light: '#009688',
    dark: '#26A69A',
  },

  userIds: [
    'camdawgboi',
    ['showdextestee', 'Verified Showdex Testee'],
    'showdextester',
    'sumfuk',
  ],
}, {
  title: 'Bunny Hopper',
  supporterId: null,
  custom: true,
  icon: 'rabbit',
  iconDescription: '"Bunny" Icon',

  color: {
    light: '#AD1457',
    dark: '#D81B60',
  },

  userIds: [
    ['ttoki', 'twitch.tv/tt0ki'],
  ],
}, {
  title: 'Showdex Royalty',
  supporterId: null,
  custom: false,
  icon: 'crown',
  iconDescription: 'Crown Icon',

  color: {
    light: '#F57F17',
    dark: '#FFB300',
  },

  userIds: [
    'agentlag', // Lazosful
    'dbkeith',
    ['finchinator', 'Our Lord & Savior'],
    ['freezai', 'Randbats Reaper'],
    'heavancanwait', // DBKEITH
    'lesarlags', // Lazosful
    'l4z0s', // Lazosful
    ['mudkipnerd', "What's a King to a God"],
    'mypaloalto', // DBKEITH
    ['nails', 'VGC Legend'],
    'nathaneatschicken', // NathanLikesChicken
    'woahhhchien', // DBKEITH
  ],
}, {
  title: 'Paid Pal',
  supporterId: 'donor',
  custom: false,
  icon: 'sparkle',
  iconDescription: 'Sparkle Icon',

  color: {
    light: '#6A1B9A',
    dark: '#9C27B0',
  },

  userIds: [
    'bongphan',
    'cpl593h',
    'doublecaret',
    ['fr1e5', 'First Paid Pal'],
    'fubwubs',
    'genone',
    'goldengottago',
    'jesskykhemically',
    'joshtheking7',
    'lunarvania',
    'momalaharris',
    'mrmimikry',
    'pastgenoufan',
    'plaguevonkarma',
    // 'pokepastry', // commented to apply T.1 Patron title
    'pulseks',
    'snacky98',
    'weavileisasin',
  ],
}, {
  title: 'Blaziken Patron',
  supporterId: 'patreon-tier-01',
  custom: false,
  icon: 'fire',
  iconDescription: 'Fire Icon',

  color: {
    light: '#C62828',
    dark: '#F44336',
  },

  userIds: [
    ['bruhmomentmaker', 'First Blaziken Patron'],
    'nexyralt',
    'pokepastry',
    'thenexyr',
  ],
}, {
  title: 'Pop Bomb Patron',
  supporterId: 'patreon-tier-02',
  custom: false,
  icon: 'mouse',
  iconDescription: 'Mouse Icon',

  color: {
    light: '#0277BD',
    dark: '#29B6F6',
  },

  userIds: [
    ['benzyne', 'First Showdex Patron'],
  ],
}, {
  title: 'Supreme Overlord Patron',
  supporterId: 'patreon-tier-03',
  custom: false,
  icon: 'winged-sword',
  iconDescription: 'Winged Sword Icon',

  color: {
    light: '#F57F17',
    dark: '#FFB300',
  },

  userIds: [
    'zzodz',
  ],
}, {
  title: 'First Supreme Overlord',
  supporterId: 'patreon-tier-03',
  custom: true,
  icon: 'salamance',
  iconDescription: 'Salamance by n0rtist',
  colorGlow: false,
  iconColorGlow: true,

  color: {
    light: '#1584D6',
    dark: '#1584D6',
  },

  iconColor: {
    light: '#D84042',
    dark: '#D84042',
  },

  userIds: [
    'dastardlydwarf',
  ],
}, {
  title: 'uwu',
  supporterId: 'patreon-tier-03',
  custom: true,
  icon: 'teddy-bear',
  iconDescription: 'Teddy Bear Icon',

  color: {
    light: '#F06292',
    dark: '#F06292',
  },

  userIds: [
    ['goddessmina', 'warning: ratch af'],
    'swiftmochi',
  ],
}, {
  title: 'Carried by Showdex',
  supporterId: 'patreon-tier-01',
  custom: true,
  icon: 'team-lift',
  iconDescription: 'Stick Figures Carrying Box Icon',

  color: { // requested: '#00FF00'
    light: '#00E676',
    dark: '#69F0AE',
  },

  userIds: [
    'gabrielpbc',
    'pbc88',
  ],
}, {
  title: 'Supreme Overlord Patron', /** @todo when `title` is received by patron */
  supporterId: 'patreon-tier-03',
  custom: true,
  icon: '9k-plus',
  iconDescription: '9K Plus Icon',

  color: { // requested: '#00D8FF'
    light: '#0090AA',
    dark: '#00D8FF',
  },

  userIds: [
    'ahokgotit',
    'nashketchumai',
  ],
}];
