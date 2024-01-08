import {
  DehydratedCalcdexSettingsMap,
  DehydratedHellodexSettingsMap,
  DehydratedHonkdexSettingsMap,
  DehydratedShowdexSettingsMap,
  DehydratedShowdownSettingsMap,
} from '@showdex/consts/hydro';
import {
  type ShowdexCalcdexSettings,
  type ShowdexHellodexSettings,
  type ShowdexHonkdexSettings,
  type ShowdexSettings,
  type ShowdexShowdownSettings,
} from '@showdex/interfaces/app';
import { type CalcdexPlayerKey } from '@showdex/interfaces/calc';
import { HydroDescriptor } from '@showdex/interfaces/hydro';
import { dehydrateHeader } from './dehydrateHeader';
import { dehydrateArray, dehydrateBoolean, dehydrateValue } from './dehydratePrimitives';

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
 * * `kd` refers to the `honkdex` settings (cause `hd` was already taken lmao).
 * * `sd` refers to the `showdown` settings.
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
 * lc:{locale};
 * fc:{forcedColorScheme};
 * dm:{developerMode};
 * ...
 * hd:{hellodexSettings};
 * cd:{calcdexSettings};
 * kd:{honkdexSettings};
 * sd:{showdownSettings}
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
    locale,
    forcedColorScheme,
    glassyTerrain,
    developerMode,
    hellodex,
    calcdex,
    honkdex,
    showdown,
  } = settings;

  const output: string[] = [
    dehydrateHeader(HydroDescriptor.Settings),
    `${DehydratedShowdexSettingsMap.locale}:${dehydrateValue(locale)}`,
    `${DehydratedShowdexSettingsMap.forcedColorScheme}:${dehydrateValue(forcedColorScheme)}`,
    `${DehydratedShowdexSettingsMap.glassyTerrain}:${dehydrateBoolean(glassyTerrain)}`,
    `${DehydratedShowdexSettingsMap.developerMode}:${dehydrateBoolean(developerMode)}`,
  ];

  const hellodexOutput: string[] = Object.entries(hellodex || {}).map(([
    key,
    value,
  ]: [
    keyof ShowdexHellodexSettings,
    ShowdexHellodexSettings[keyof ShowdexHellodexSettings],
  ]) => {
    const dehydratedKey = DehydratedHellodexSettingsMap[key];

    if (!dehydratedKey) {
      return null;
    }

    const dehydratedValue = dehydrateValue(value);

    return `${dehydratedKey.toLowerCase()}~${dehydratedValue}`;
  }).filter(Boolean);

  output.push(`${DehydratedShowdexSettingsMap.hellodex}:${hellodexOutput.join('|')}`);

  const calcdexOutput: string[] = Object.entries(calcdex || {}).map(([
    key,
    value,
  ]: [
    keyof ShowdexCalcdexSettings,
    ShowdexCalcdexSettings[keyof ShowdexCalcdexSettings],
  ]) => {
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

  const honkdexOutput: string[] = Object.entries(honkdex || {}).map(([
    key,
    value,
  ]: [
    keyof ShowdexHonkdexSettings,
    ShowdexHonkdexSettings[keyof ShowdexHonkdexSettings],
  ]) => {
    const dehydratedKey = DehydratedHonkdexSettingsMap[key];

    if (!dehydratedKey) {
      return null;
    }

    const dehydratedValue = dehydrateValue(value);

    return `${dehydratedKey.toLowerCase()}~${dehydratedValue}`;
  }).filter(Boolean);

  output.push(`${DehydratedShowdexSettingsMap.honkdex}:${honkdexOutput.join('|')}`);

  const showdownOutput: string[] = Object.entries(showdown || {}).map(([
    key,
    value,
  ]: [
    keyof ShowdexShowdownSettings,
    ShowdexShowdownSettings[keyof ShowdexShowdownSettings],
  ]) => {
    const dehydratedKey = DehydratedShowdownSettingsMap[key];

    if (!dehydratedKey) {
      return null;
    }

    const dehydratedValue = dehydrateValue(value);

    return `${dehydratedKey.toLowerCase()}~${dehydratedValue}`;
  }).filter(Boolean);

  output.push(`${DehydratedShowdexSettingsMap.showdown}:${showdownOutput.join('|')}`);

  return output.filter(Boolean).join(';');
};
