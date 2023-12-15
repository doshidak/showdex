import {
  type ShowdexCalcdexSettings,
  type ShowdexHellodexSettings,
  type ShowdexSettings,
  type ShowdexShowdownSettings,
} from '@showdex/interfaces/app';
import { reverseObjectKv } from '@showdex/utils/core';

/**
 * Opcode mappings for the dehydrated root `ShowdexSettings`.
 *
 * @since 1.0.3
 */
export const DehydratedShowdexSettingsMap: Record<keyof ShowdexSettings, string> = {
  colorScheme: 'cs',
  forcedColorScheme: 'fc',
  developerMode: 'dm',
  hellodex: 'hd',
  calcdex: 'cd',
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
  autoImportTeamSheets: 'ats',
  autoExportOpponent: 'aeo',
  defaultAutoMoves: 'dam',
  forceNonVolatile: 'fnv', // thought about alwaysShowStatus, but ya... LOL
  editPokemonTypes: 'ept',
  lockUsedTera: 'lut',
  resetDirtyBoosts: 'rdb',
  showMoveEditor: 'sme',
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
