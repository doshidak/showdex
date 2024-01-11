import {
  type ShowdexCalcdexSettings,
  type ShowdexHellodexSettings,
  type ShowdexHonkdexSettings,
  type ShowdexSettings,
  type ShowdexShowdownSettings,
} from '@showdex/interfaces/app';
import { reverseObjectKv } from '@showdex/utils/core';
import { ShowdexPresetsBundles } from '@showdex/consts/app';

/**
 * Default Showdex settings.
 *
 * @since 1.2.0
 */
export const DefaultShowdexSettings: ShowdexSettings = {
  locale: null, // falling back to LanguageDetector
  colorScheme: null,
  forcedColorScheme: 'showdown',
  glassyTerrain: false,
  developerMode: __DEV__,

  hellodex: {
    openOnStart: true,
    focusRoomsRoom: false,
    showBattleRecord: true,
    showDonateButton: true,
  },

  calcdex: {
    openOnStart: 'always',
    openAs: 'showdown',
    openOnPanel: 'showdown',
    closeOn: 'battle-tab',
    destroyOnClose: true,

    defaultAutoSelect: {
      auth: true,
      p1: true,
      p2: true,
      p3: true,
      p4: true,
    },

    showPlayerRatings: true,
    authPosition: 'top',
    showNicknames: false,
    openSmogonPage: true,
    showAllOptions: false,
    showSpreadsFirst: false,
    showNonDamageRanges: true,
    downloadSmogonPresets: true,
    downloadRandomsPresets: true,
    downloadUsageStats: true,
    maxPresetAge: 3,
    prioritizeUsageStats: false,
    includeTeambuilder: 'always',
    includeOtherMetaPresets: false,
    includePresetsBundles: ShowdexPresetsBundles.map((b) => !b?.disabled && b.id).filter(Boolean),
    autoImportTeamSheets: true,
    autoExportOpponent: false,

    defaultAutoMoves: {
      auth: false,
      p1: true,
      p2: true,
      p3: true,
      p4: true,
    },

    forceNonVolatile: true,
    lockUsedTera: false,
    resetDirtyBoosts: true,
    editPokemonTypes: 'always',
    showMoveEditor: 'meta',
    enableQuickEditor: true,
    showBaseStats: 'meta',
    showLegacyEvs: false,

    lockGeneticsVisibility: {
      auth: [],
      p1: ['iv', 'ev'],
      p2: ['iv', 'ev'],
      p3: ['iv', 'ev'],
      p4: ['iv', 'ev'],
    },

    allowIllegalSpreads: 'meta',
    showUiTooltips: true,
    showAbilityTooltip: true,
    showItemTooltip: true,
    showMoveTooltip: true,
    showMatchupTooltip: true,
    prettifyMatchupDescription: true,
    showMatchupDamageAmounts: 'nfe',
    formatMatchupDamageAmounts: true,
    copyMatchupDescription: true,
    showFieldTooltips: true,

    nhkoColors: [
      '#4CAF50',
      '#FF9800',
      '#FF9800',
      '#F44336',
      '#F44336',
    ],

    nhkoLabels: [
      '1HKO',
      '2HKO',
      '3HKO',
      '4HKO',
    ],
  },

  honkdex: {
    visuallyEnabled: true,
    showAllFormats: false,
    alwaysEditTypes: true,
    alwaysEditMoves: true,
    alwaysShowGenetics: true,
  },

  showdown: {
    autoAcceptSheets: false,
  },
};

/**
 * Opcode mappings for the dehydrated root `ShowdexSettings`.
 *
 * @since 1.0.3
 */
export const DehydratedShowdexSettingsMap: Record<keyof ShowdexSettings, string> = {
  locale: 'lc',
  colorScheme: 'cs',
  forcedColorScheme: 'fc',
  glassyTerrain: 'gt',
  developerMode: 'dm',
  hellodex: 'hd',
  calcdex: 'cd',
  honkdex: 'kd',
  showdown: 'sd',
};

/**
 * Reverse opcode-to-key mappings for the hydrated root `ShowdexSettings`.
 *
 * @since 1.0.3
 */
export const HydratedShowdexSettingsMap = reverseObjectKv(DehydratedShowdexSettingsMap);

/**
 * Opcode mappings for the dehydrated `ShowdexHellodexSettings`.
 *
 * @since 1.0.3
 */
export const DehydratedHellodexSettingsMap: Record<keyof ShowdexHellodexSettings, string> = {
  openOnStart: 'oos',
  focusRoomsRoom: 'frr',
  showBattleRecord: 'sbr',
  showDonateButton: 'sdb',
};

/**
 * Reverse opcode-to-key mappings for the hydrated `ShowdexHellodexSettings`.
 *
 * @since 1.0.3
 */
export const HydratedHellodexSettingsMap = reverseObjectKv(DehydratedHellodexSettingsMap);

/**
 * Opcode mappings for the dehydrated `ShowdexCalcdexSettings`.
 *
 * @since 1.0.3
 */
export const DehydratedCalcdexSettingsMap: Record<keyof ShowdexCalcdexSettings, string> = {
  openOnStart: 'oos',
  openAs: 'oas',
  openOnPanel: 'oop',
  closeOn: 'con',
  destroyOnClose: 'doc',
  defaultAutoSelect: 'das',
  showPlayerRatings: 'spr',
  authPosition: 'aps',
  showNicknames: 'snn',
  openSmogonPage: 'osp',
  showAllOptions: 'sao',
  showSpreadsFirst: 'ssf',
  showNonDamageRanges: 'snd',
  downloadSmogonPresets: 'dsp',
  downloadRandomsPresets: 'drp',
  downloadUsageStats: 'dus',
  maxPresetAge: 'mpa',
  prioritizeUsageStats: 'pus',
  includeTeambuilder: 'itb',
  includeOtherMetaPresets: 'iom',
  includePresetsBundles: 'ipb',
  autoImportTeamSheets: 'ats',
  autoExportOpponent: 'aeo',
  defaultAutoMoves: 'dam',
  forceNonVolatile: 'fnv', // thought about alwaysShowStatus, but ya... LOL
  editPokemonTypes: 'ept',
  lockUsedTera: 'lut',
  resetDirtyBoosts: 'rdb',
  showMoveEditor: 'sme',
  enableQuickEditor: 'eqe',
  showBaseStats: 'sbs',
  showLegacyEvs: 'sle',
  lockGeneticsVisibility: 'lgv',
  allowIllegalSpreads: 'ais',
  showUiTooltips: 'sut',
  showAbilityTooltip: 'sat',
  showItemTooltip: 'sit',
  showMoveTooltip: 'smv',
  showMatchupTooltip: 'smu',
  prettifyMatchupDescription: 'pmd',
  showMatchupDamageAmounts: 'sda',
  formatMatchupDamageAmounts: 'fda',
  copyMatchupDescription: 'cmd',
  showFieldTooltips: 'sft',
  nhkoColors: 'ncl',
  nhkoLabels: 'nlb',
};

/**
 * Reverse opcode-to-key mappings for the hydrated `ShowdexCalcdexSettings`.
 *
 * @since 1.0.3
 */
export const HydratedCalcdexSettingsMap = reverseObjectKv(DehydratedCalcdexSettingsMap);

/**
 * Opcode mappings for the dehydrated `ShowdexHonkdexSettings`.
 *
 * @since 1.2.0
 */
export const DehydratedHonkdexSettingsMap: Record<keyof ShowdexHonkdexSettings, string> = {
  visuallyEnabled: 'ven',
  showAllFormats: 'saf',
  alwaysEditTypes: 'aet',
  alwaysEditMoves: 'aem',
  alwaysShowGenetics: 'asg',
};

/**
 * Reverse opcode-to-key mappings for the hydrated `ShowdexHonkdexSettings`.
 *
 * @since 1.2.0
 */
export const HydratedHonkdexSettingsMap = reverseObjectKv(DehydratedHonkdexSettingsMap);

/**
 * Opcode mappings for the dehydrated `ShowdexShowdownSettings`.
 *
 * @since 1.1.7
 */
export const DehydratedShowdownSettingsMap: Record<keyof ShowdexShowdownSettings, string> = {
  autoAcceptSheets: 'aas',
};

/**
 * Reverse opcode-to-key mappings for the hydrated `ShowdexShowdownSettings`.
 *
 * @since 1.1.7
 */
export const HydratedShowdownSettingsMap = reverseObjectKv(DehydratedShowdownSettingsMap);
