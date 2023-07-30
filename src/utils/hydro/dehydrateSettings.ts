import { HydroDescriptor } from '@showdex/consts/hydro';
import {
  type CalcdexPlayerKey,
  type ShowdexCalcdexSettings,
  type ShowdexHellodexSettings,
  type ShowdexSettings,
} from '@showdex/redux/store';
// import { env } from '@showdex/utils/core';
import { dehydrateHeader } from './dehydrateHeader';
import { dehydrateArray, dehydrateBoolean, dehydrateValue } from './dehydratePrimitives';

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
};

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
 * Opcode mappings for the dehydrated `ShowdexCalcdexSettings`.
 *
 * @since 1.0.3
 */
export const DehydratedCalcdexSettingsMap: Record<keyof ShowdexCalcdexSettings, string> = {
  openOnStart: 'oos',
  openAs: 'oas',
  openOnPanel: 'oop',
  // forcedOpenAs: 'foa',
  // closeOnEnd: 'coe',
  closeOn: 'con',
  destroyOnClose: 'doc',
  // preserveRenderStates: 'prs',
  defaultAutoSelect: 'das',
  showPlayerRatings: 'spr',
  authPosition: 'aps',
  showNicknames: 'snn',
  // reverseIconName: 'rin',
  openSmogonPage: 'osp',
  // showAllFormes: 'saf',
  showAllOptions: 'sao',
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
  // defaultShowGenetics: 'dsg',
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
 * Dehydrates a per-side settings `value`.
 *
 * @example
 * ```ts
 * dehydratePerSide({
 *   auth: false,
 *   p1: true,
 *   p2: true,
 *   p3: true,
 *   p4: true,
 * });
 *
 * 'n/y/y/y/y'
 * ```
 * @example
 * ```ts
 * dehydratePerSide({
 *   auth: [],
 *   p1: ['iv', 'ev'],
 *   p2: ['iv', 'ev'],
 *   p3: ['iv', 'ev'],
 *   p4: ['iv', 'ev'],
 * });
 *
 * '/iv,ev/iv,ev/iv,ev/iv,ev'
 * ```
 * @since 1.0.3
 */
export const dehydratePerSide = (
  value: Record<'auth' | CalcdexPlayerKey, unknown>,
  delimiter = '/',
  arrayDelimiter = ',',
): string => Object.keys(value || {})
  .sort()
  .map((key: 'auth' | CalcdexPlayerKey) => (
    Array.isArray(value[key])
      ? dehydrateArray(value[key] as unknown[], arrayDelimiter)
      : dehydrateValue(value[key])
  ))
  .join(delimiter);

/**
 * Dehydrates (serializes) the passed-in `settings`, typically for storing in `LocalStorage`.
 *
 * Follows a similar pattern to `dehydrateCalcdex()`, with each "root" property of the `settings` given its own "opcode":
 *
 * * `fc` refers to the `forcedColorScheme`.
 * * `dm` refers to the `developerMode`.
 * * `hd` refers to the `hellodex` settings.
 * * `cd` refers to the `calcdex` settings.
 *
 * * Note that the `colorScheme` setting is not dehydrated as it pertains to the current value at runtime, subject to change.
 *
 * With additional properties that may be useful for versioning for settings imports:
 *
 * * `v` refers to the package version (`process.env.PACKAGE_VERSION`).
 * * `b` refers to the build date (`process.env.BUILD_DATE`).
 *
 * Dehydrated `settings`, whose properties are deliminated by a semi-colon (`';'`), is in the following format:
 *
 * ```
 * {...header};
 * fc:{forcedColorScheme};
 * dm:{developerMode};
 * hd:{hellodexSettings};
 * cd:{calcdexSettings}
 * ```
 *
 * * Note that the output string contains no newlines (`\n`) despite being depicted in the formatting above,
 *   which is only done for readabililty purposes.
 *
 * where `{hellodexSettings}`, whose properties are deliminated by a pipe (`'|'`), is in the following format:
 *
 * ```
 * oos~{openOnStart}
 * frr~{focusRoomsRoom}
 * ```
 *
 * and `{calcdexSettings}`, whose properties are deliminated by a pipe (`'|'`), is in the following format:
 *
 * ```
 * oos~{openOnStart}|
 * oas~{openAs}|
 * oop~{openOnPanel}|
 * con~{closeOn}|
 * ...
 * ```
 *
 * * Update (2023/07/01): ya this list in the jsdoc became a bitch to maintain, so just hitting you with those `...`'s c:
 *
 * @since 1.0.3
 */
export const dehydrateSettings = (settings: ShowdexSettings): string => {
  if (!Object.keys(settings || {}).length) {
    return null;
  }

  const {
    forcedColorScheme,
    developerMode,
    hellodex,
    calcdex,
  } = settings;

  const output: string[] = [
    dehydrateHeader(HydroDescriptor.Settings),
    // `${DehydratedShowdexSettingsMap.packageVersion}:${env('package-version', '?')}`,
    // `${DehydratedShowdexSettingsMap.buildDate}:${env('build-date', '?')}`,
    `${DehydratedShowdexSettingsMap.forcedColorScheme}:${dehydrateValue(forcedColorScheme)}`,
    `${DehydratedShowdexSettingsMap.developerMode}:${dehydrateBoolean(developerMode)}`,
  ];

  const hellodexOutput: string[] = Object.entries(hellodex || {}).map((
    [key, value]: [
      keyof ShowdexHellodexSettings,
      ShowdexHellodexSettings[keyof ShowdexHellodexSettings],
    ],
  ) => {
    const dehydratedKey = DehydratedHellodexSettingsMap[key];

    if (!dehydratedKey) {
      return null;
    }

    const dehydratedValue = dehydrateValue(value);

    return `${dehydratedKey.toLowerCase()}~${dehydratedValue}`;
  }).filter(Boolean);

  output.push(`${DehydratedShowdexSettingsMap.hellodex}:${hellodexOutput.join('|')}`);

  const calcdexOutput: string[] = Object.entries(calcdex || {}).map((
    [key, value]: [
      keyof ShowdexCalcdexSettings,
      ShowdexCalcdexSettings[keyof ShowdexCalcdexSettings],
    ],
  ) => {
    const dehydratedKey = DehydratedCalcdexSettingsMap[key];

    if (!dehydratedKey) {
      return null;
    }

    const dehydratedValue = Array.isArray(value)
      ? dehydrateArray(value)
      : typeof value === 'object' && 'p1' in (value || {})
        ? dehydratePerSide(value)
        : dehydrateValue(value);

    return `${dehydratedKey.toLowerCase()}~${dehydratedValue}`;
  }).filter(Boolean);

  output.push(`${DehydratedShowdexSettingsMap.calcdex}:${calcdexOutput.join('|')}`);

  return output.filter(Boolean).join(';');
};
